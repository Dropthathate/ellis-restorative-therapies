<?php
declare(strict_types=1);

// Server-side relay for the ERT Google Apps Script. Booking data is submitted by POST
// so client contact information is not placed in the browser URL.
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwLS377dvlP5TRgZviL5Pmaj_RBFbeXUTszmU7KbcEdyAyLA8rURceBGq5GWro_cAR9/exec';

function sendResponse(string $body, int $status = 200): void {
  http_response_code($status);
  echo $body;
  exit;
}

function callAppsScript(string $url, string $method, ?string $body = null): string {
  $request = curl_init($url);
  curl_setopt_array($request, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT => 20,
    CURLOPT_SSL_VERIFYPEER => true,
  ]);

  if ($method === 'POST') {
    curl_setopt($request, CURLOPT_POST, true);
    curl_setopt($request, CURLOPT_POSTFIELDS, $body);
    curl_setopt($request, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    if (defined('CURLOPT_POSTREDIR') && defined('CURL_REDIR_POST_ALL')) {
      curl_setopt($request, CURLOPT_POSTREDIR, CURL_REDIR_POST_ALL);
    }
  }

  $response = curl_exec($request);
  $error = curl_error($request);
  $status = (int) curl_getinfo($request, CURLINFO_HTTP_CODE);
  curl_close($request);

  if ($response === false || $status >= 400) {
    sendResponse(json_encode(['success' => false, 'error' => 'The booking service is temporarily unavailable.']), 502);
  }
  if ($error) {
    sendResponse(json_encode(['success' => false, 'error' => 'The booking service is temporarily unavailable.']), 502);
  }

  return (string) $response;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $payload = json_decode((string) file_get_contents('php://input'), true);
  if (!is_array($payload) || ($payload['action'] ?? '') !== 'booking') {
    sendResponse(json_encode(['success' => false, 'error' => 'Invalid booking request.']), 400);
  }

  $allowed = ['action', 'therapist', 'name', 'phone', 'email', 'date', 'time', 'duration', 'price', 'notes'];
  $clean = [];
  foreach ($allowed as $key) {
    if (isset($payload[$key])) $clean[$key] = substr(trim((string) $payload[$key]), 0, 1000);
  }
  sendResponse(callAppsScript(APPS_SCRIPT_URL, 'POST', json_encode($clean)));
}

$action = (string) ($_GET['action'] ?? '');
if (!in_array($action, ['availability', 'slots'], true)) {
  sendResponse(json_encode(['success' => false, 'error' => 'Unsupported request.']), 400);
}

$params = [
  'action' => $action,
  'therapist' => substr(trim((string) ($_GET['therapist'] ?? 'zachary')), 0, 32),
];
if ($action === 'availability') {
  $params['month'] = (string) ((int) ($_GET['month'] ?? -1));
  $params['year'] = (string) ((int) ($_GET['year'] ?? 0));
} else {
  $params['date'] = substr(trim((string) ($_GET['date'] ?? '')), 0, 10);
}

sendResponse(callAppsScript(APPS_SCRIPT_URL . '?' . http_build_query($params), 'GET'));
