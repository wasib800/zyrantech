<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mikrotik_server_id')->nullable()->constrained()->onDelete('set null');
            $table->string('username')->unique();
            $table->string('name')->nullable();
            $table->string('phone')->nullable();
            $table->string('profile')->nullable();
            $table->string('ip_address')->nullable();
            $table->string('mac_address')->nullable();
            $table->enum('status', ['active','blocked','inactive'])->default('active');
            $table->boolean('is_online')->default(false);
            $table->decimal('monthly_bill', 10, 2)->default(0);
            $table->date('expire_date')->nullable();
            $table->timestamp('last_online_at')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('clients');
    }
};