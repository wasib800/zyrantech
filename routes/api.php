<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\MikrotikController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\DashboardController;

// Mikrotik Server
Route::post('/mikrotik/{id}/import-queue', [MikrotikController::class, 'importQueue']);
Route::get('/mikrotik', [MikrotikController::class, 'index']);
Route::post('/mikrotik', [MikrotikController::class, 'store']);
Route::post('/mikrotik/{id}/sync', [MikrotikController::class, 'sync']);
Route::post('/mikrotik/{id}/import', [MikrotikController::class, 'import']);

// Clients
Route::get('/clients', [ClientController::class, 'index']);
Route::post('/clients/{id}/block', [MikrotikController::class, 'block']);
Route::post('/clients/{id}/unblock', [MikrotikController::class, 'unblock']);

// Dashboard
Route::get('/dashboard/stats', [DashboardController::class, 'stats']);