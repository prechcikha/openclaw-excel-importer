<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::get('/health', function (Request $request) {
    return response()->json(['status' => 'healthy', 'time' => now()]);
});

// Connection management
Route::post('/api/connection/test', [App\Http\Controllers\API\ConnectionController::class, 'test'])
    ->name('api.connection.test');

Route::get('/api/connection/configure', [App\Http\Controllers\API\ConnectionController::class, 'configureForm'])
    ->name('api.connection.configure');

// File upload and parsing
Route::post('/api/upload/file', [App\Http\Controllers\API\UploadController::class, 'upload'])
    ->name('api.upload.file');

Route::get('/api/upload/{filename}/columns', [App\Http\Controllers\API\UploadController::class, 'getColumns'])
    ->name('api.upload.columns');

Route::post('/api/upload/{filename}/preview', [App\Http\Controllers\API\UploadController::class, 'preview'])
    ->name('api.upload.preview');

// Column mapping
Route::post('/api/mapping/save', [App\Http\Controllers\API\MappingController::class, 'saveMapping'])
    ->name('api.mapping.save');

Route::get('/api/mapping/{jobId}', [App\Http\Controllers\API\MappingController::class, 'getMapping'])
    ->name('api.mapping.get');

Route::delete('/api/mapping/{jobId}', [App\Http\Controllers\API\MappingController::class, 'deleteMapping'])
    ->name('api.mapping.delete');

// Import execution
Route::post('/api/import/execute', [App\Http\Controllers\API\ImportController::class, 'execute'])
    ->name('api.import.execute');

Route::get('/api/import/{jobId}/status', [App\Http\Controllers\API\ImportController::class, 'getStatus'])
    ->name('api.import.status');

Route::post('/api/import/{jobId}/result', [App\Http\Controllers\API\ImportController::class, 'getResult'])
    ->name('api.import.result');
