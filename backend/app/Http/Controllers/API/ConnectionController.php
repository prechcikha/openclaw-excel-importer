<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use PDOException;

class ConnectionController extends Controller
{
    /**
     * Test connection to remote MSSQL server
     */
    public function test(Request $request)
    {
        try {
            $server = $request->input('server');
            $database = $request->input('database', 'tempdb');
            $trustedConnection = $request->input('trusted_connection', true);
            
            // Build connection string
            $connectionString = "Driver={ODBC Driver 18 for SQL Server}";
            $params = [
                'Server' => $server,
                'Database' => $database,
                'Trusted_Connection' => $trustedConnection ? 'yes' : 'no',
            ];
            
            if (!$trustedConnection) {
                $params['UID'] = $request->input('username');
                $params['PWD'] = $request->input('password');
            }
            
            // Test connection using PDO directly (bypasses SQL Server extension requirement)
            $dsn = "ODBC:" . str_replace("'", "''", $connectionString);
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ];
            
            $pdo = new PDO($dsn, null, null, $options + $params);
            
            return response()->json([
                'success' => true,
                'message' => 'Connection successful',
                'server' => $server,
                'database' => $database
            ]);
            
        } catch (PDOException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Connection failed: ' . $e->getMessage()
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get connection configuration form data
     */
    public function configureForm(Request $request)
    {
        return response()->json([
            'server' => env('MSSQL_SERVER', ''),
            'database' => env('MSSQL_DATABASE', ''),
            'trusted_connection' => filter_var(env('MSSQL_TRUSTED_CONNECTION', true), FILTER_VALIDATE_BOOLEAN)
        ]);
    }
}
