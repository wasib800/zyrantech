<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\MikrotikController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\OLTController;

// Mikrotik Server
Route::get('/mikrotik', [MikrotikController::class, 'index']);
Route::post('/mikrotik', [MikrotikController::class, 'store']);
Route::delete('/mikrotik/{id}', [MikrotikController::class, 'destroy']);
Route::post('/mikrotik/{id}/import', [MikrotikController::class, 'import']);
Route::post('/mikrotik/{id}/import-queue', [MikrotikController::class, 'importQueue']);
Route::post('/mikrotik/{id}/sync', [MikrotikController::class, 'sync']);

// Clients
Route::get('/clients', [ClientController::class, 'index']);
Route::post('/clients/{id}/block', [MikrotikController::class, 'block']);
Route::post('/clients/{id}/unblock', [MikrotikController::class, 'unblock']);

// Dashboard
Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

// OLT
Route::get('/olt', [OLTController::class, 'index']);
Route::post('/olt', [OLTController::class, 'store']);
Route::delete('/olt/{id}', [OLTController::class, 'destroy']);
Route::get('/olt/{id}/stats', [OLTController::class, 'stats']);
Route::get('/olt/{id}/onus', [OLTController::class, 'onus']);
Route::post('/olt/{id}/sync', [OLTController::class, 'sync']);
