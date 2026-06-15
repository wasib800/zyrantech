<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MikrotikServer extends Model
{
    protected $fillable = [
        'name', 'ip_address', 'port',
        'username', 'password',
        'is_connected', 'is_active', 'last_synced_at'
    ];

    protected $hidden = ['password'];

    public function clients()
    {
        return $this->hasMany(Client::class);
    }
}