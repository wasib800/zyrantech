<?php
namespace App\Services;

use PEAR2\Net\RouterOS\Client;
use PEAR2\Net\RouterOS\Request;

class MikrotikService
{
    private string $ip;
    private string $user;
    private string $pass;
    private int $port;

    public function __construct(string $ip, string $user, string $pass, int $port = 8728)
    {
        $this->ip = $ip;
        $this->user = $user;
        $this->pass = $pass;
        $this->port = $port;
    }

    private function connect(): ?Client
    {
        try {
            return new Client($this->ip, $this->user, $this->pass, $this->port);
        } catch (\Exception $e) {
            \Log::error("Mikrotik connect failed: {$this->ip} - " . $e->getMessage());
            return null;
        }
    }

    public function testConnection(): bool
    {
        $client = $this->connect();
        if (!$client) return false;
        try {
            $request = new Request('/system/identity/print');
            $client->sendSync($request);
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    public function getActiveUsers(): array
    {
        $client = $this->connect();
        if (!$client) return [];
        try {
            $request = new Request('/ppp/active/print');
            $response = $client->sendSync($request);
            $users = [];
            foreach ($response as $item) {
                $users[] = [
                    'name' => $item->getArgument('name'),
                    'address' => $item->getArgument('address'),
                    'caller-id' => $item->getArgument('caller-id'),
                    'uptime' => $item->getArgument('uptime'),
                    'service' => $item->getArgument('service'),
                ];
            }
            return $users;
        } catch (\Exception $e) {
            return [];
        }
    }

    public function getAllUsers(): array
    {
        $client = $this->connect();
        if (!$client) return [];
        try {
            $request = new Request('/ppp/secret/print');
            $response = $client->sendSync($request);
            $users = [];
            foreach ($response as $item) {
                $users[] = [
                    'name' => $item->getArgument('name'),
                    'profile' => $item->getArgument('profile'),
                    'remote-address' => $item->getArgument('remote-address'),
                    'disabled' => $item->getArgument('disabled'),
                ];
            }
            return $users;
        } catch (\Exception $e) {
            return [];
        }
    }

    public function getQueueClients(): array
    {
        $client = $this->connect();
        if (!$client) return [];
        try {
            $request = new Request('/queue/simple/print');
            $response = $client->sendSync($request);
            $queues = [];
            foreach ($response as $item) {
                $queues[] = [
                    'name' => $item->getArgument('name'),
                    'target' => $item->getArgument('target'),
                    'max-limit' => $item->getArgument('max-limit'),
                    'disabled' => $item->getArgument('disabled'),
                ];
            }
            return $queues;
        } catch (\Exception $e) {
            return [];
        }
    }

    public function blockQueueUser(string $username): bool
    {
        $client = $this->connect();
        if (!$client) return false;
        try {
            // Find queue by name
            $findReq = new Request('/queue/simple/print');
            $findReq->setArgument('?name', $username);
            $response = $client->sendSync($findReq);
            foreach ($response as $item) {
                $setReq = new Request('/queue/simple/set');
                $setReq->setArgument('.id', $item->getArgument('.id'));
                $setReq->setArgument('max-limit', '1/1');
                $client->sendSync($setReq);
            }
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    public function unblockQueueUser(string $username, string $maxLimit = '10M/10M'): bool
    {
        $client = $this->connect();
        if (!$client) return false;
        try {
            $findReq = new Request('/queue/simple/print');
            $findReq->setArgument('?name', $username);
            $response = $client->sendSync($findReq);
            foreach ($response as $item) {
                $setReq = new Request('/queue/simple/set');
                $setReq->setArgument('.id', $item->getArgument('.id'));
                $setReq->setArgument('max-limit', $maxLimit);
                $client->sendSync($setReq);
            }
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    public function blockUser(string $username): bool
    {
        $client = $this->connect();
        if (!$client) return false;
        try {
            $findReq = new Request('/ppp/secret/print');
            $findReq->setArgument('?name', $username);
            $response = $client->sendSync($findReq);
            foreach ($response as $item) {
                $setReq = new Request('/ppp/secret/set');
                $setReq->setArgument('.id', $item->getArgument('.id'));
                $setReq->setArgument('disabled', 'yes');
                $client->sendSync($setReq);
            }
            $this->disconnectUser($username);
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    public function unblockUser(string $username): bool
    {
        $client = $this->connect();
        if (!$client) return false;
        try {
            $findReq = new Request('/ppp/secret/print');
            $findReq->setArgument('?name', $username);
            $response = $client->sendSync($findReq);
            foreach ($response as $item) {
                $setReq = new Request('/ppp/secret/set');
                $setReq->setArgument('.id', $item->getArgument('.id'));
                $setReq->setArgument('disabled', 'no');
                $client->sendSync($setReq);
            }
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    public function disconnectUser(string $username): bool
    {
        $client = $this->connect();
        if (!$client) return false;
        try {
            $findReq = new Request('/ppp/active/print');
            $findReq->setArgument('?name', $username);
            $response = $client->sendSync($findReq);
            foreach ($response as $item) {
                $removeReq = new Request('/ppp/active/remove');
                $removeReq->setArgument('.id', $item->getArgument('.id'));
                $client->sendSync($removeReq);
            }
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    public function syncOnlineStatus(): array
    {
        $active = $this->getActiveUsers();
        return array_column($active, 'name');
    }

    public function getARPTable(): array
    {
        $client = $this->connect();
        if (!$client) return [];
        try {
            $request = new Request('/ip/arp/print');
            $response = $client->sendSync($request);
            $arp = [];
            foreach ($response as $item) {
                $arp[] = [
                    'address' => $item->getArgument('address'),
                    'mac-address' => $item->getArgument('mac-address'),
                    'interface' => $item->getArgument('interface'),
                ];
            }
            return $arp;
        } catch (\Exception $e) {
            return [];
        }
    }

    public function request(string $endpoint, string $method = 'GET', array $data = []): array
    {
        // Fallback REST API for RouterOS 7
        $url = "http://{$this->ip}:{$this->port}/rest{$endpoint}";
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_USERPWD, "{$this->user}:{$this->pass}");
        curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        $response = curl_exec($ch);
        curl_close($ch);
        $result = json_decode($response, true);
        return is_array($result) ? $result : [];
    }
}
