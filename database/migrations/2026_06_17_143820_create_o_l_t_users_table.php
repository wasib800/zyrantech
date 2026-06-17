<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('o_l_t_users', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('o_l_t_id');
            $table->string('name')->nullable();
            $table->string('mac_address')->nullable();
            $table->string('olt_port')->nullable();
            $table->decimal('rx_power', 8, 2)->nullable();
            $table->integer('distance')->nullable();
            $table->enum('status', ['online','offline'])->default('offline');
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('o_l_t_users');
    }
};