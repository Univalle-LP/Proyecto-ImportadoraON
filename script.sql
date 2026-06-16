-- Active: 1742483176453@@127.0.0.1@3306@importadoraon
CREATE INDEX idx_producto_id ON HISTORIAL_INVENTARIO(producto_id);
CREATE INDEX idx_movimiento_id ON HISTORIAL_INVENTARIO(movimiento_id);
CREATE INDEX idx_empleado_id ON HISTORIAL_INVENTARIO(empleado_id);

INSERT INTO ROL (nombre, descripcion) VALUES 
('Cliente', 'Usuarios que compran productos'),
('Empleado', 'Personal de la empresa'),
('Administrador', 'Administradores del sistema');

INSERT INTO ESTADO_PEDIDO (nombre, descripcion) VALUES
('Pendiente', 'Pedido recibido pero no procesado'),
('En preparación', 'Pedido en proceso de preparación'),
('Enviado', 'Pedido enviado al cliente'),
('Entregado', 'Pedido entregado satisfactoriamente'),
('Cancelado', 'Pedido cancelado');

INSERT INTO INVENTARIO_MOVIMIENTO (nombre, descripcion, afecta_stock) VALUES
('Compra', 'Ingreso de productos por compra', 'Incrementa'),
('Venta', 'Salida de productos por venta', 'Decrementa'),
('Ajuste', 'Ajuste manual de inventario', 'Incrementa');

INSERT INTO METODO_PAGO (nombre, descripcion, activo) VALUES
('Efectivo', 'Pago en efectivo', TRUE),
('PayPal', 'Pago con billetera digital', TRUE);

INSERT INTO PAIS (nombre) VALUES
('Bolivia')

INSERT INTO DEPARTAMENTO (nombre, pais_id) VALUES
('La Paz', 1),
('Cochabamba', 1),
('Santa Cruz', 1),
('Oruro', 1);

INSERT INTO GENERO (nombre)VALUES
('Masculino'),
('Femenino'),
('Otro');

INSERT INTO EMPRESA (nombre, nit, telefono, direccion, email, pais_id) VALUES
('EL CEIBO', '123456789', '22841078', 'Av. Juan Pablo II #2560 (Final Autopista) El Alto, La Paz','agencia.elalto@elceibo.com', 1);

