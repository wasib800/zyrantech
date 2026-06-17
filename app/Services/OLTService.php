<?php
namespace App\Services;

class OLTService
{
    private string $ip;
    private string $community;
    private int $port;

    const OID_NAME     = '1.3.6.1.4.1.3320.101.10.1.1.2';
    const OID_STATUS   = '1.3.6.1.4.1.3320.101.10.1.1.26';
    const OID_RX_POWER = '1.3.6.1.4.1.3320.101.10.1.1.80';
    const OID_DISTANCE = '1.3.6.1.4.1.3320.101.10.1.1.34';
    const OID_MAC      = '1.3.6.1.4.1.3320.101.10.1.1.3';
    const OID_SYSINFO  = '1.3.6.1.2.1.1.1.0';

    public function __construct(string $ip, string $community = 'public', int $port = 161)
    {
        $this->ip = $ip;
        $this->community = $community;
        $this->port = $port;
    }

    private function walk(string $oid): array
    {
        $result = @\snmpwalk($this->ip, $this->community, $oid, 3000000, 1);
        return is_array($result) ? $result : [];
    }

    private function get(string $oid): string
    {
        $result = @\snmpget($this->ip, $this->community, $oid);
        return $result ?: '';
    }

    private function parseValue(string $val): string
    {
        $val = preg_replace('/^[A-Z\-]+:\s*/', '', $val);
        return trim($val, ' "');
    }

private function parseRxPower(string $raw): float
{
    $val = intval(preg_replace('/[^0-9]/', '', $raw));
    if ($val === 0) return 0;

    // Range 1: 28000-39999 → (val-40000)/1000
    if ($val >= 28000 && $val <= 39999) {
        return round(($val - 40000) / 1000, 2);
    }
    // Range 2: 10000-27999 → (val-30000)/1000  
    if ($val >= 10000 && $val <= 27999) {
        return round(($val - 30000) / 1000, 2);
    }
    // Range 3: 5000-9999 → (val-10000)/100
    if ($val >= 5000 && $val <= 9999) {
        return round(($val - 10000) / 100, 2);
    }

    return 0;
}

    public function testConnection(): bool
    {
        $result = $this->get(self::OID_SYSINFO);
        return !empty($result);
    }

    public function getSystemInfo(): string
    {
        return $this->parseValue($this->get(self::OID_SYSINFO));
    }

    public function getStats(): array
    {
        $statuses = $this->walk(self::OID_STATUS);
        $online = 0;
        $offline = 0;
        foreach ($statuses as $st) {
            $val = intval(preg_replace('/[^0-9]/', '', $st));
            if ($val === 3) $online++; else $offline++;
        }
        return [
            'total'  => count($statuses),
            'online' => $online,
            'offline'=> $offline,
            'system' => $this->getSystemInfo(),
        ];
    }

    public function getONUList(): array
    {
        $names     = $this->walk(self::OID_NAME);
        $statuses  = $this->walk(self::OID_STATUS);
        $rxPowers  = $this->walk(self::OID_RX_POWER);
        $distances = $this->walk(self::OID_DISTANCE);
        $macs      = $this->walk(self::OID_MAC);

        $onus = [];
        $online = 0;
        $offline = 0;

        foreach ($names as $i => $name) {
            $nameClean = $this->parseValue($name);
            $statusRaw = intval(preg_replace('/[^0-9]/', '', $statuses[$i] ?? '0'));
            $isOnline  = ($statusRaw === 3);
            if ($isOnline) $online++; else $offline++;

            $rxDbm = $this->parseRxPower($rxPowers[$i] ?? '0');
            $dist  = intval(preg_replace('/[^0-9]/', '', $distances[$i] ?? '0'));

            $macRaw = $macs[$i] ?? '';
            $mac = '';
            if (str_contains($macRaw, 'Hex-STRING:')) {
                $hex = trim(str_replace('Hex-STRING:', '', $macRaw));
                $mac = implode(':', array_map('strtoupper', explode(' ', trim($hex))));
            }

            $onus[] = [
                'index'    => $i,
                'name'     => $nameClean,
                'status'   => $isOnline ? 'online' : 'offline',
                'rx_power' => $rxDbm,
                'distance' => $dist,
                'mac'      => $mac,
            ];
        }

        return [
            'onus'   => $onus,
            'total'  => count($onus),
            'online' => $online,
            'offline'=> $offline,
        ];
    }
}