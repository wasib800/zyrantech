<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;

class ClientController extends Controller
{
    public function index()
    {
        return response()->json(
            Client::with('server')->get()
        );
    }

    public function show($id)
    {
        return response()->json(
            Client::with('server')->findOrFail($id)
        );
    }
}