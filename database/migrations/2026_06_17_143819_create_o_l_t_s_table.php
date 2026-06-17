<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('o_l_t_s', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('ip_address');
            $table->integer('port')->default(161);
            $table->string('community')->default('public');
            $table->enum('olt_type', ['BDCOM_GPON','ZTE_GPON','HUAWEI_GPON','EPON'])->default('BDCOM_GPON');
            $table->enum('status', ['online','offline','warning'])->default('offline');
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('o_l_t_s');
    }
};