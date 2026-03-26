<?php
// scripts/Login/login.php

// Define que o ficheiro vai devolver dados em formato JSON
header('Content-Type: application/json');

// Recebe os dados enviados pelo JavaScript (fetch)
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, TRUE);

$username = isset($input['username']) ? trim($input['username']) : '';
$password = isset($input['password']) ? $input['password'] : '';

if (empty($username) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Por favor, preencha todos os campos.']);
    exit;
}

// ==========================================================
// BANCO DE DADOS SIMULADO (Array)
// Futuramente, substituiremos isto por uma query MySQL.
// ==========================================================
$usuarios = [
    [
        "id" => 1, 
        "nome" => "João Santos", 
        "username" => "joao.santos", 
        "senha" => "senha_segura", // Senha definida no adm.js
        "role" => "Admin master", 
        "status" => "Ativo"
    ],
    [
        "id" => 2, 
        "nome" => "Rennan Avelino", 
        "username" => "rennan.avelino", 
        "senha" => "123456", // Defini 123456 como padrão provisório
        "role" => "Terceiro técnico de campo", 
        "status" => "Ativo"
    ],
    [
        "id" => 3, 
        "nome" => "David Lima", 
        "username" => "david.lima", 
        "senha" => "123456", 
        "role" => "Terceiro empresa de elevador", 
        "status" => "Ativo"
    ],
    [
        "id" => 4, 
        "nome" => "Gilmar Alves", 
        "username" => "gilmar.alves", 
        "senha" => "123456", 
        "role" => "Terceiro empresa de elevador", 
        "status" => "Ativo"
    ]
];

$usuarioAutenticado = null;
$credenciaisValidas = false;

// Procura o utilizador no "Banco de Dados"
foreach ($usuarios as $user) {
    if ($user['username'] === $username) {
        if ($user['senha'] === $password) {
            $credenciaisValidas = true;
            $usuarioAutenticado = $user;
        }
        break; // Utilizador encontrado, não precisa continuar o loop
    }
}

// Respostas para o Frontend
if ($credenciaisValidas) {
    if ($usuarioAutenticado['status'] !== 'Ativo') {
        echo json_encode(['success' => false, 'message' => 'A sua conta encontra-se bloqueada.']);
        exit;
    }

    // Por segurança, removemos a senha do array antes de enviar para o navegador
    unset($usuarioAutenticado['senha']);

    echo json_encode([
        'success' => true,
        'user' => $usuarioAutenticado
    ]);
} else {
    echo json_encode([
        'success' => false, 
        'message' => 'Utilizador ou palavra-passe incorretos.'
    ]);
}
?>