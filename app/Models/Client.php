<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    protected $fillable = [
        'mikrotik_server_id', 'username', 'name',
        'phone', 'profile', 'ip_address', 'mac_address',
        'status', 'is_online', 'monthly_bill',
        'expire_date', 'last_online_at'
    ];

    protected $casts = [
        'is_online' => 'boolean',
        'expire_date' => 'date',
    ];

    public function server()
    {
        return $this->belongsTo(MikrotikServer::class, 'mikrotik_server_id');
    }
}