<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Reader\Xlsx;
use PhpOffice\PhpSpreadsheet\Reader\Csv;
use PhpOffice\PhpSpreadsheet\Reader\Xls;
use PhpOffice\PhpSpreadsheet\Shared\File as SpreadsheetFile;

class UploadController extends Controller
{
    /**
     * Upload and parse Excel file
     */
    public function upload(Request $request)
    {
        if (!$request->hasFile('file')) {
            return response()->json(['error' => 'No file uploaded'], 400);
        }

        $file = $request->file('file');
        
        // Validate file type
        $allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        'application/vnd.ms-excel', 'text/csv'];
        
        if (!in_array($file->getMimeType(), $allowedTypes)) {
            return response()->json(['error' => 'Invalid file type. Only .xlsx, .xls, and .csv files are allowed'], 400);
        }

        // Store file temporarily
        $filename = uniqid('import_') . '_' . $file->getClientOriginalName();
        $filePath = storage_path('app/uploads/' . $filename);
        
        if (!$file->move(storage_path('app/uploads'), $filename)) {
            return response()->json(['error' => 'Failed to upload file'], 500);
        }

        // Parse Excel file
        try {
            $reader = IOFactory::createReader($file->getMimeType());
            $spreadsheet = $reader->load($filePath);
            
            // Get first sheet
            $sheet = $spreadsheet->getActiveSheet();
            
            // Extract column headers (first row)
            $headers = [];
            foreach ($sheet->getRowIterator(1) as $row) {
                $cellIterator = $row->getCellIterator();
                $cellIterator->setIterateOnlyExistingCells(false);
                
                foreach ($cellIterator as $cell) {
                    if (isset($headers[$cell->getColumn()])) continue;
                    $headers[$cell->getColumn()] = trim($cell->getValue());
                }
                break; // Only first row for headers
            }

            return response()->json([
                'success' => true,
                'filename' => $filename,
                'columns' => array_values($headers),
                'column_map' => $headers,
                'total_rows' => $sheet->getRowCount() - 1 // Exclude header row
            ]);
            
        } catch (\Exception $e) {
            // Clean up failed upload
            \Storage::disk('local')->delete($filename);
            
            return response()->json([
                'error' => 'Failed to parse file: ' . $e->getMessage()
            ], 400);
        }
    }

    /**
     * Get parsed column information
     */
    public function getColumns(Request $request, $filename)
    {
        $filePath = storage_path('app/uploads/' . $filename);
        
        if (!file_exists($filePath)) {
            return response()->json(['error' => 'File not found'], 404);
        }

        try {
            $reader = IOFactory::createReader($this->getMimeTypeFromFilename($filename));
            $spreadsheet = $reader->load($filePath);
            
            $sheet = $spreadsheet->getActiveSheet();
            $headers = [];
            
            foreach ($sheet->getRowIterator(1) as $row) {
                $cellIterator = $row->getCellIterator();
                $cellIterator->setIterateOnlyExistingCells(false);
                
                foreach ($cellIterator as $cell) {
                    $col = $cell->getColumn();
                    if (!isset($headers[$col])) {
                        $value = trim($cell->getValue());
                        $type = $this->inferType($value);
                        $headers[$col] = [
                            'name' => $value,
                            'type' => $type,
                            'index' => array_search($col, array_keys($headers)) + 1
                        ];
                    }
                }
                break;
            }

            return response()->json(['columns' => array_values($headers)]);
            
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Preview data from file
     */
    public function preview(Request $request, $filename)
    {
        $filePath = storage_path('app/uploads/' . $filename);
        
        if (!file_exists($filePath)) {
            return response()->json(['error' => 'File not found'], 404);
        }

        try {
            $reader = IOFactory::createReader($this->getMimeTypeFromFilename($filename));
            $spreadsheet = $reader->load($filePath);
            $sheet = $spreadsheet->getActiveSheet();
            
            // Get headers first
            $headers = [];
            foreach ($sheet->getRowIterator(1) as $row) {
                $cellIterator = $row->getCellIterator();
                $cellIterator->setIterateOnlyExistingCells(false);
                
                foreach ($cellIterator as $cell) {
                    if (!isset($headers[$cell->getColumn()])) {
                        $headers[$cell->getColumn()] = trim($cell->getValue());
                    }
                }
                break;
            }

            // Get data rows
            $rowsLimit = $request->input('rows_limit', 100);
            $data = [];
            
            foreach ($sheet->getRowIterator(2, min($rowsLimit + 1)) as $row) {
                $cells = [];
                $cellIterator = $row->getCellIterator();
                $cellIterator->setIterateOnlyExistingCells(false);
                
                foreach ($cellIterator as $cell) {
                    $col = $cell->getColumn();
                    if (isset($headers[$col])) {
                        $cells[] = [
                            'header' => $headers[$col],
                            'value' => trim($cell->getValue())
                        ];
                    }
                }
                
                $data[] = $cells;
            }

            return response()->json(['rows' => $data]);
            
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    private function getMimeTypeFromFilename($filename)
    {
        $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        
        return match ($ext) {
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'xls' => 'application/vnd.ms-excel',
            'csv' => 'text/csv',
            default => throw new \Exception('Unsupported file format')
        };
    }

    private function inferType($value)
    {
        if (is_numeric($value)) {
            return $value == (int)$value ? 'integer' : 'decimal';
        }
        
        if (preg_match('/^\d{4}-\d{2}-\d{2}/', $value)) {
            return 'date';
        }
        
        if (preg_match('/(\d{1,2}:\d{2}(:\d{2})?)/', $value)) {
            return 'time';
        }
        
        if (strtoupper($value) === 'TRUE' || strtoupper($value) === 'FALSE') {
            return 'boolean';
        }
        
        return 'text';
    }
}
