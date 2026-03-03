-- ============================================================
-- CALLCENTER PLATFORM - SEED DATA
-- Passwords: Admin123! (bcrypt hash pre-generado)
-- ============================================================

-- ADMIN
INSERT INTO users (id, name, email, password_hash, role, status) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Carlos Ramírez', 'admin@callcenter.com',
   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'active');

-- SUPERVISORES
INSERT INTO users (id, name, email, password_hash, role, status, supervisor_id) VALUES
  ('00000000-0000-0000-0000-000000000002', 'Laura Mendoza', 'laura@callcenter.com',
   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'supervisor', 'active', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000003', 'Miguel Torres', 'miguel@callcenter.com',
   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'supervisor', 'active', '00000000-0000-0000-0000-000000000001');

-- AGENTES
INSERT INTO users (id, name, email, password_hash, role, status, supervisor_id, phone) VALUES
  ('00000000-0000-0000-0000-000000000004', 'Ana García', 'ana@callcenter.com',
   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'agent', 'active', '00000000-0000-0000-0000-000000000002', '+51 999 111 001'),
  ('00000000-0000-0000-0000-000000000005', 'Pedro Ruiz', 'pedro@callcenter.com',
   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'agent', 'active', '00000000-0000-0000-0000-000000000002', '+51 999 111 002'),
  ('00000000-0000-0000-0000-000000000006', 'Sofia Castro', 'sofia@callcenter.com',
   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'agent', 'active', '00000000-0000-0000-0000-000000000003', '+51 999 111 003'),
  ('00000000-0000-0000-0000-000000000007', 'Luis Herrera', 'luis@callcenter.com',
   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'agent', 'inactive', '00000000-0000-0000-0000-000000000003', '+51 999 111 004');

-- CLIENTES
INSERT INTO clients (id, name, email, phone, company, status, assigned_agent_id) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Empresa TechPeru S.A.C.', 'contacto@techperu.com', '+51 1 234 5678', 'TechPeru', 'interested', '00000000-0000-0000-0000-000000000004'),
  ('10000000-0000-0000-0000-000000000002', 'Distribuidora Lima Norte', 'ventas@limanorte.pe', '+51 1 345 6789', 'Lima Norte', 'contacted', '00000000-0000-0000-0000-000000000004'),
  ('10000000-0000-0000-0000-000000000003', 'Constructora Andina', 'info@andina.com', '+51 1 456 7890', 'Andina Corp', 'new', '00000000-0000-0000-0000-000000000005'),
  ('10000000-0000-0000-0000-000000000004', 'Farmacéutica Salud+', 'compras@saludmas.pe', '+51 1 567 8901', 'Salud+', 'closed', '00000000-0000-0000-0000-000000000005'),
  ('10000000-0000-0000-0000-000000000005', 'Importaciones del Pacífico', 'gerencia@pacifico.pe', '+51 1 678 9012', 'Pacífico', 'lost', '00000000-0000-0000-0000-000000000006'),
  ('10000000-0000-0000-0000-000000000006', 'Retail Express Perú', 'logistica@retailexpress.pe', '+51 1 789 0123', 'Retail Express', 'interested', '00000000-0000-0000-0000-000000000006'),
  ('10000000-0000-0000-0000-000000000007', 'Agroindustrias del Sur', 'admin@agrosur.pe', '+51 54 123 456', 'AgroSur', 'new', NULL),
  ('10000000-0000-0000-0000-000000000008', 'Grupo Financiero Nexus', 'riesgos@nexus.pe', '+51 1 890 1234', 'Nexus Group', 'contacted', '00000000-0000-0000-0000-000000000004');

-- LLAMADAS
INSERT INTO calls (client_id, agent_id, status, result, duration_seconds, notes, created_at, finished_at) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'finished', 'sale', 420, 'Cliente muy interesado, cerró contrato por 12 meses.', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours' + INTERVAL '7 minutes'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 'finished', 'follow_up', 180, 'Solicitó propuesta por email. Llamar mañana.', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours' + INTERVAL '3 minutes'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000005', 'finished', 'no_answer', 0, 'No contesta. Intentar en horario de tarde.', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005', 'finished', 'sale', 600, 'Venta concretada. Enviar contrato.', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours' + INTERVAL '10 minutes'),
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000006', 'finished', 'contacted', 240, 'Mostró interés en el plan empresarial.', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '5 hours' + INTERVAL '4 minutes'),
  ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000004', 'pending', NULL, 0, NULL, NOW(), NULL),
  ('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000005', 'in_progress', NULL, 0, NULL, NOW(), NULL),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000006', 'finished', 'follow_up', 300, 'Segunda llamada. Requiere aprobación interna.', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '5 minutes'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 'finished', 'sale', 480, 'Renovó su contrato anual.', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '8 minutes'),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000006', 'finished', 'no_answer', 0, 'Número no disponible.', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days');

-- INTERACCIONES
INSERT INTO interactions (client_id, user_id, type, description, created_at) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'call', 'Primera llamada de contacto. Cliente interesado en plan empresarial Premium.', NOW() - INTERVAL '3 days'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'note', 'Envié brochure por email. Esperar respuesta.', NOW() - INTERVAL '2 days'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'call', 'Llamada de seguimiento. Cerró contrato por 12 meses.', NOW() - INTERVAL '2 hours'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 'call', 'Primer contacto. Pidió información sobre precios.', NOW() - INTERVAL '2 days'),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005', 'call', 'Llamada exitosa. Venta cerrada del plan Estándar.', NOW() - INTERVAL '4 hours');
