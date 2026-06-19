<?php
namespace App\Services;

class OLTService
{
    private string $ip;
    private string $community;
    private int $port;
    private string $olt_type;

    const OID_SYSINFO = '1.3.6.1.2.1.1.1.0';

    // ── BDCOM GPON ──────────────────────────────────────────
    const BDCOM_GPON_NAME     = '1.3.6.1.4.1.3320.101.10.1.1.2';
    const BDCOM_GPON_STATUS   = '1.3.6.1.4.1.3320.101.10.1.1.26';
    const BDCOM_GPON_RX       = '1.3.6.1.4.1.3320.101.10.1.1.80';
    const BDCOM_GPON_DISTANCE = '1.3.6.1.4.1.3320.101.10.1.1.34';
    const BDCOM_GPON_MAC      = '1.3.6.1.4.1.3320.101.10.1.1.3';

    // ── BDCOM EPON ──────────────────────────────────────────
    const BDCOM_EPON_NAME     = '1.3.6.1.4.1.3320.9.71.1.1.1.4';
    const BDCOM_EPON_STATUS   = '1.3.6.1.4.1.3320.9.71.1.1.1.14';
    const BDCOM_EPON_RX       = '1.3.6.1.4.1.3320.9.71.1.1.1.18';
    const BDCOM_EPON_MAC      = '1.3.6.1.4.1.3320.9.71.1.1.1.2';

    // ── ZTE GPON ────────────────────────────────────────────
    const ZTE_GPON_NAME       = '1.3.6.1.4.1.3902.1082.500.10.2.1.2';
    const ZTE_GPON_STATUS     = '1.3.6.1.4.1.3902.1082.500.10.2.1.19';
    const ZTE_GPON_RX         = '1.3.6.1.4.1.3902.1082.500.10.2.1.26';
    const ZTE_GPON_MAC        = '1.3.6.1.4.1.3902.1082.500.10.2.1.4';

    // ── ZTE EPON ────────────────────────────────────────────
    const ZTE_EPON_NAME       = '1.3.6.1.4.1.3902.1015.1010.1.1.1.3';
    const ZTE_EPON_STATUS     = '1.3.6.1.4.1.3902.1015.1010.1.1.1.9';
    const ZTE_EPON_RX         = '1.3.6.1.4.1.3902.1015.1010.1.1.1.12';
    const ZTE_EPON_MAC        = '1.3.6.1.4.1.3902.1015.1010.1.1.1.4';

    // ── Huawei GPON ─────────────────────────────────────────
    const HUAWEI_GPON_NAME    = '1.3.6.1.4.1.2011.6.128.1.1.2.43.1.1';
    const HUAWEI_GPON_STATUS  = '1.3.6.1.4.1.2011.6.128.1.1.2.46.1.15';
    const HUAWEI_GPON_RX      = '1.3.6.1.4.1.2011.6.128.1.1.2.51.1.4';

    // ── VSOL GPON ───────────────────────────────────────────
    const VSOL_GPON_NAME      = '1.3.6.1.4.1.37950.1.1.5.11.1.2';
    const VSOL_GPON_STATUS    = '1.3.6.1.4.1.37950.1.1.5.11.1.9';
    const VSOL_GPON_RX        = '1.3.6.1.4.1.37950.1.1.5.11.1.12';
    const VSOL_GPON_MAC       = '1.3.6.1.4.1.37950.1.1.5.11.1.3';

    // ── VSOL EPON ───────────────────────────────────────────
    const VSOL_EPON_NAME      = '1.3.6.1.4.1.37950.1.1.5.12.1.2';
    const VSOL_EPON_STATUS    = '1.3.6.1.4.1.37950.1.1.5.12.1.9';
    const VSOL_EPON_RX        = '1.3.6.1.4.1.37950.1.1.5.12.1.12';
    const VSOL_EPON_MAC       = '1.3.6.1.4.1.37950.1.1.5.12.1.3';

    // ── Quantico / Air Media / Generic EPON (Richerlink IF-MIB) ─
    const EPON_GENERIC_NAME   = '1.3.6.1.2.1.2.2.1.2';
    const EPON_GENERIC_STATUS = '1.3.6.1.2.1.2.2.1.8';
    const EPON_GENERIC_RX     = '1.3.6.1.4.1.17409.2.3.4.1.1.10';
    const EPON_GENERIC_MAC    = '1.3.6.1.2.1.2.2.1.6';

    // ── C-Data EPON ─────────────────────────────────────────
    const CDATA_EPON_NAME     = '1.3.6.1.4.1.34592.1.3.5.1.1.4';
    const CDATA_EPON_STATUS   = '1.3.6.1.4.1.34592.1.3.5.1.1.19';
    const CDATA_EPON_RX       = '1.3.6.1.4.1.34592.1.3.5.1.1.22';
    const CDATA_EPON_MAC      = '1.3.6.1.4.1.34592.1.3.5.1.1.3';

    // ── FiberHome GPON ──────────────────────────────────────
    const FIBERHOME_GPON_NAME   = '1.3.6.1.4.1.5875.91.1.5.1.1.1.2';
    const FIBERHOME_GPON_STATUS = '1.3.6.1.4.1.5875.91.1.5.1.1.1.19';
    const FIBERHOME_GPON_RX     = '1.3.6.1.4.1.5875.91.1.5.1.1.1.27';
    const FIBERHOME_GPON_MAC    = '1.3.6.1.4.1.5875.91.1.5.1.1.1.4';

    public function __construct(string $ip, string $community = 'public', int $port = 161, string $olt_type = 'BDCOM_GPON')
    {
        $this->ip        = $ip;
        $this->community = $community;
        $this->port      = $port;
        $this->olt_type  = strtoupper($olt_type);
    }

    private function getOIDs(): array
    {
        return match($this->olt_type) {
            'BDCOM_EPON'      => ['name'=>self::BDCOM_EPON_NAME,     'status'=>self::BDCOM_EPON_STATUS,   'rx'=>self::BDCOM_EPON_RX,      'mac'=>self::BDCOM_EPON_MAC,      'dist'=>null, 'online_val'=>1, 'filter_prefix'=>null],
            'ZTE_GPON'        => ['name'=>self::ZTE_GPON_NAME,       'status'=>self::ZTE_GPON_STATUS,     'rx'=>self::ZTE_GPON_RX,        'mac'=>self::ZTE_GPON_MAC,        'dist'=>null, 'online_val'=>1, 'filter_prefix'=>null],
            'ZTE_EPON'        => ['name'=>self::ZTE_EPON_NAME,       'status'=>self::ZTE_EPON_STATUS,     'rx'=>self::ZTE_EPON_RX,        'mac'=>self::ZTE_EPON_MAC,        'dist'=>null, 'online_val'=>1, 'filter_prefix'=>null],
            'HUAWEI_GPON'     => ['name'=>self::HUAWEI_GPON_NAME,    'status'=>self::HUAWEI_GPON_STATUS,  'rx'=>self::HUAWEI_GPON_RX,     'mac'=>null,                      'dist'=>null, 'online_val'=>1, 'filter_prefix'=>null],
            'VSOL_GPON'       => ['name'=>self::VSOL_GPON_NAME,      'status'=>self::VSOL_GPON_STATUS,    'rx'=>self::VSOL_GPON_RX,       'mac'=>self::VSOL_GPON_MAC,       'dist'=>null, 'online_val'=>1, 'filter_prefix'=>null],
            'VSOL_EPON'       => ['name'=>self::VSOL_EPON_NAME,      'status'=>self::VSOL_EPON_STATUS,    'rx'=>self::VSOL_EPON_RX,       'mac'=>self::VSOL_EPON_MAC,       'dist'=>null, 'online_val'=>1, 'filter_prefix'=>null],
            'QUANTICO_GPON',
            'QUANTICO_EPON',
            'AIRMEDIA_GPON',
            'AIRMEDIA_EPON',
            'EPON'            => ['name'=>self::EPON_GENERIC_NAME,   'status'=>self::EPON_GENERIC_STATUS, 'rx'=>self::EPON_GENERIC_RX,    'mac'=>self::EPON_GENERIC_MAC,    'dist'=>null, 'online_val'=>1, 'filter_prefix'=>'epon'],
            'CDATA_EPON'      => ['name'=>self::CDATA_EPON_NAME,     'status'=>self::CDATA_EPON_STATUS,   'rx'=>self::CDATA_EPON_RX,      'mac'=>self::CDATA_EPON_MAC,      'dist'=>null, 'online_val'=>1, 'filter_prefix'=>null],
            'FIBERHOME_GPON'  => ['name'=>self::FIBERHOME_GPON_NAME, 'status'=>self::FIBERHOME_GPON_STATUS,'rx'=>self::FIBERHOME_GPON_RX, 'mac'=>self::FIBERHOME_GPON_MAC,  'dist'=>null, 'online_val'=>1, 'filter_prefix'=>null],
            default           => ['name'=>'1.3.6.1.2.1.2.2.1.2',     'status'=>self::BDCOM_GPON_STATUS,   'rx'=>self::BDCOM_GPON_RX,      'mac'=>self::BDCOM_GPON_MAC,      'dist'=>self::BDCOM_GPON_DISTANCE, 'online_val'=>3, 'filter_prefix'=>'EPON0'],
        };
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
        // BDCOM GPON range
        if ($val >= 28000 && $val <= 39999) return round(($val - 40000) / 1000, 2);
        if ($val >= 10000 && $val <= 27999) return round(($val - 30000) / 1000, 2);
        if ($val >= 5000  && $val <= 9999)  return round(($val - 10000) / 100, 2);
        // EPON/VSOL range (0.01 dBm units)
        if ($val >= 1000 && $val <= 5000)   return round($val / -100, 2);
        // Raw negative dBm
        if ($val > -50 && $val < 0)         return round($val, 2);
        return 0;
    }

    private function parseMac(string $raw): string
    {
        if (str_contains($raw, 'Hex-STRING:')) {
            $hex = trim(str_replace('Hex-STRING:', '', $raw));
            return implode(':', array_map('strtoupper', explode(' ', trim($hex))));
        }
        if (str_contains($raw, 'STRING:')) {
            return trim(str_replace('STRING:', '', $raw), ' "');
        }
        return '';
    }

    public function testConnection(): bool
    {
        return !empty($this->get(self::OID_SYSINFO));
    }

    public function getSystemInfo(): string
    {
        return $this->parseValue($this->get(self::OID_SYSINFO));
    }

    public function getStats(): array
    {
        $oids     = $this->getOIDs();
        $statuses = $this->walk($oids['status']);
        $online   = 0; $offline = 0;
        foreach ($statuses as $st) {
            $val = intval(preg_replace('/[^0-9]/', '', $st));
            if ($val === $oids['online_val']) $online++; else $offline++;
        }
        return ['total'=>count($statuses), 'online'=>$online, 'offline'=>$offline, 'system'=>$this->getSystemInfo()];
    }

    public function getONUList(): array
    {
        $oids      = $this->getOIDs();
        $isBDCOM   = str_contains($this->olt_type, 'BDCOM');

        // Use snmprealwalk for BDCOM to get OID indexes (port info)
        if ($isBDCOM) {
            $nameRaw = @snmprealwalk($this->ip, $this->community, $oids['name'], 3000000, 1);
        } else {
            $nameRaw = null;
        }

        $names     = $this->walk($oids['name']);
        $statuses  = $this->walk($oids['status']);
        $rxPowers  = $this->walk($oids['rx']);
        $macs      = $oids['mac']  ? $this->walk($oids['mac'])  : [];
        $distances = $oids['dist'] ? $this->walk($oids['dist']) : [];

        $onus = []; $online = 0; $offline = 0;
        $prefix = $oids['filter_prefix'] ?? null;

        // Get OID indexes for BDCOM port calculation
        $oidIndexes = [];
        if ($isBDCOM && $nameRaw) {
            $i = 0;
            foreach ($nameRaw as $key => $val) {
                $parts = explode('.', $key);
                $oidIndexes[$i] = intval(end($parts));
                $i++;
            }
        }

        foreach ($names as $i => $name) {
            $nameClean = $this->parseValue($name);

            // Filter: only show ONU interfaces (epon1:0, epon2:1 etc), skip lo/ge/xe/vlan
            if ($prefix && !(str_starts_with($nameClean, $prefix) && str_contains($nameClean, ':'))) continue;

            $statusVal = intval(preg_replace('/[^0-9]/', '', $statuses[$i] ?? '0'));
            $isOnline  = $statusVal === $oids['online_val'];
            if ($isOnline) $online++; else $offline++;

            // Calculate port number
            $port = null;
            if ($isBDCOM) {
                // EPON0/1:4 -> port 1, EPON0/8:2 -> port 8
                if (preg_match('/EPON0\/(\d+):/', $nameClean, $m)) {
                    $port = intval($m[1]);
                } elseif (isset($oidIndexes[$i])) {
                    $port = intval($oidIndexes[$i] / 100);
                }
            }

            $onus[] = [
                'index'    => $i,
                'name'     => $nameClean ?: "ONU-{$i}",
                'status'   => $isOnline ? 'online' : 'offline',
                'rx_power' => isset($rxPowers[$i]) ? $this->parseRxPower($rxPowers[$i]) : 0,
                'distance' => isset($distances[$i]) ? intval(preg_replace('/[^0-9]/', '', $distances[$i])) : 0,
                'mac'      => isset($macs[$i]) ? $this->parseMac($macs[$i]) : '',
                'port'     => $port,
            ];
        }

        return ['onus'=>$onus, 'total'=>count($onus), 'online'=>$online, 'offline'=>$offline];
    }
}
