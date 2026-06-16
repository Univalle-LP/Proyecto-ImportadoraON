-- Active: 1742483176453@@127.0.0.1@3306@importadoraon
DROP DATABASE IF EXISTS importadoraon;
CREATE DATABASE importadoraon;
USE importadoraon;

CREATE TABLE GENERO (
    cod_genero INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE PAIS (
    cod_pais INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE DEPARTAMENTO (
    cod_departamento INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    pais_id INT NOT NULL,
    FOREIGN KEY (pais_id) REFERENCES PAIS(cod_pais)
);

CREATE TABLE ESTADO_COMPRA (
    cod_estado INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE EMPRESA (
    cod_empresa INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    nit VARCHAR(30),
    telefono VARCHAR(30),
    direccion TEXT,
    email VARCHAR(100),
    pais_id INT,
    FOREIGN KEY (pais_id) REFERENCES PAIS(cod_pais)
);


CREATE TABLE CARGO (
    cod_cargo INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    salario DECIMAL(10,2),
    descripcion TEXT
);



CREATE TABLE REGISTRO (
    cod_registro INT PRIMARY KEY AUTO_INCREMENT,
    usuario VARCHAR(50) not null,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    ultimo_login DATETIME,
    activo BOOLEAN DEFAULT TRUE,
    token_recuperacion VARCHAR(255),
    token_expiracion DATETIME
);

CREATE TABLE ROL (
    cod_rol INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE USUARIO_ROL (
    cod_usuario_rol INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    rol_id INT NOT NULL,
    fecha_asignacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES REGISTRO(cod_registro) ON DELETE CASCADE,
    FOREIGN KEY (rol_id) REFERENCES ROL(cod_rol) ON DELETE CASCADE,
    UNIQUE (usuario_id, rol_id)
);

CREATE TABLE CLIENTE (
    cod_cliente INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT UNIQUE,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    ci_o_nit VARCHAR(30) UNIQUE,
    celular VARCHAR(30),
    fecha_nacimiento DATE,
    genero_id INT,
    FOREIGN KEY (usuario_id) REFERENCES REGISTRO(cod_registro) ON DELETE CASCADE,
    FOREIGN KEY (genero_id) REFERENCES GENERO(cod_genero)
);

CREATE TABLE DIRECCION_CLIENTE (
    cod_direccion INT PRIMARY KEY AUTO_INCREMENT,
    cliente_id INT NOT NULL,
    direccion TEXT NOT NULL,
    ciudad VARCHAR(100),
    departamento_id INT,
    pais_id INT,
    codigo_postal VARCHAR(20),
    referencia TEXT,
    FOREIGN KEY (cliente_id) REFERENCES CLIENTE(cod_cliente) ON DELETE CASCADE,
    FOREIGN KEY (departamento_id) REFERENCES DEPARTAMENTO(cod_departamento),
    FOREIGN KEY (pais_id) REFERENCES PAIS(cod_pais)
);

CREATE TABLE EMPLEADO (
    cod_empleado INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT UNIQUE, 
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    ci VARCHAR(20) UNIQUE,
    celular VARCHAR(30),
    direccion TEXT,
    fecha_contratacion DATE,
    fecha_nacimiento DATE,
    foto VARCHAR(255),
    cod_cargo INT,
    genero_id INT,
    FOREIGN KEY (usuario_id) REFERENCES REGISTRO(cod_registro) ON DELETE CASCADE,
    FOREIGN KEY (cod_cargo) REFERENCES CARGO(cod_cargo),
    FOREIGN KEY (genero_id) REFERENCES GENERO(cod_genero)
);

CREATE TABLE ADMINISTRADOR (
    cod_admin INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT UNIQUE,
    empleado_id INT UNIQUE,
    FOREIGN KEY (usuario_id) REFERENCES REGISTRO(cod_registro) ON DELETE CASCADE,
    FOREIGN KEY (empleado_id) REFERENCES EMPLEADO(cod_empleado) ON DELETE CASCADE
);

CREATE TABLE PROVEEDOR (
    cod_proveedor INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    telefono VARCHAR(30),
    direccion TEXT,
    empresa_id INT,
    representante VARCHAR(100),
    FOREIGN KEY (empresa_id) REFERENCES EMPRESA(cod_empresa)

);

-- Tabla Categoría
CREATE TABLE CATEGORIA (
    cod_cat INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100),
    descripcion TEXT,
    activa BOOLEAN DEFAULT TRUE
);

-- Tabla Producto
CREATE TABLE PRODUCTO (
    cod_producto INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100),
    descripcion TEXT,
    precio DECIMAL(10,2),
    precio_compra DECIMAL(10,2),
    stock INT,
    stock_minimo INT,
    foto TEXT,
    cod_cat INT,
    proveedor_id INT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cod_cat) REFERENCES CATEGORIA(cod_cat),
    FOREIGN KEY (proveedor_id) REFERENCES PROVEEDOR(cod_proveedor)
);

-- Tabla Descuento
CREATE TABLE DESCUENTO (
    cod_descuento INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100),
    porcentaje DECIMAL(5,2),
    descripcion TEXT,
    fecha_inicio DATE,
    fecha_fin DATE,
    activo BOOLEAN DEFAULT TRUE
);

-- Tabla Cliente Descuento
CREATE TABLE CLIENTE_DESCUENTO (
    cod_cliente_descuento INT PRIMARY KEY AUTO_INCREMENT,
    cliente_id INT,
    descuento_id INT,
    fecha_asignacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES CLIENTE(cod_cliente) ON DELETE CASCADE,
    FOREIGN KEY (descuento_id) REFERENCES DESCUENTO(cod_descuento) ON DELETE CASCADE
);

-- Tabla Metodo de Pago
CREATE TABLE METODO_PAGO (
    cod_metodo INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE
);

-- Tabla Estado Pedido
CREATE TABLE ESTADO_PEDIDO (
    cod_estado INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT
);

-- Tabla Pedido
CREATE TABLE PEDIDO (
    cod_pedido INT PRIMARY KEY AUTO_INCREMENT,
    cliente_id INT,
    fecha_pedido DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_entrega DATETIME,
    subtotal DECIMAL(10,2),
    descuento DECIMAL(10,2) DEFAULT 0,
    iva DECIMAL(10,2),
    total DECIMAL(10,2),
    estado_id INT,
    metodo_pago_id INT,
    direccion_entrega_id INT,
    observaciones TEXT,
    FOREIGN KEY (cliente_id) REFERENCES CLIENTE(cod_cliente),
    FOREIGN KEY (estado_id) REFERENCES ESTADO_PEDIDO(cod_estado),
    FOREIGN KEY (metodo_pago_id) REFERENCES METODO_PAGO(cod_metodo),
    FOREIGN KEY (direccion_entrega_id) REFERENCES DIRECCION_CLIENTE(cod_direccion)
);

-- Tabla Detalle Pedido
CREATE TABLE DETALLE_PEDIDO (
    cod_detalle INT PRIMARY KEY AUTO_INCREMENT,
    pedido_id INT,
    producto_id INT,
    cantidad INT,
    precio_unitario DECIMAL(10,2),
    descuento_unitario DECIMAL(10,2) DEFAULT 0,
    subtotal DECIMAL(10,2),
    FOREIGN KEY (pedido_id) REFERENCES PEDIDO(cod_pedido) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES PRODUCTO(cod_producto)
);

-- Tabla Compra
CREATE TABLE COMPRA (
    cod_compra INT PRIMARY KEY AUTO_INCREMENT,
    proveedor_id INT,
    empleado_id INT,
    fecha_compra DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_recibido DATETIME,
    subtotal DECIMAL(10,2),
    iva DECIMAL(10,2),
    total DECIMAL(10,2),
    estado VARCHAR(20) DEFAULT 'Pendiente',
    factura_numero VARCHAR(50),
    observaciones TEXT,
    estado_id INT DEFAULT 1, -- Asumiendo que 1 es "Pendiente" en ESTADO_COMPRA
    FOREIGN KEY (proveedor_id) REFERENCES PROVEEDOR(cod_proveedor),
    FOREIGN KEY (empleado_id) REFERENCES EMPLEADO(cod_empleado),
    FOREIGN KEY (estado_id) REFERENCES ESTADO_COMPRA(cod_estado)
);

-- Tabla Detalle Compra
CREATE TABLE DETALLE_COMPRA (
    cod_detalle INT PRIMARY KEY AUTO_INCREMENT,
    compra_id INT,
    producto_id INT,
    cantidad INT,
    precio_unitario DECIMAL(10,2),
    subtotal DECIMAL(10,2),
    FOREIGN KEY (compra_id) REFERENCES COMPRA(cod_compra) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES PRODUCTO(cod_producto)
);

-- Tabla Inventario Movimiento
CREATE TABLE INVENTARIO_MOVIMIENTO (
    cod_movimiento INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT,
    afecta_stock ENUM('Incrementa', 'Decrementa') NOT NULL
);

-- Tabla Historial Inventario
CREATE TABLE HISTORIAL_INVENTARIO (
    cod_historial INT PRIMARY KEY AUTO_INCREMENT,
    producto_id INT,
    movimiento_id INT,
    fecha_movimiento DATETIME DEFAULT CURRENT_TIMESTAMP,
    cantidad INT,
    stock_anterior INT,
    stock_nuevo INT,
    referencia_id INT,
    referencia_tipo ENUM('Pedido', 'Compra', 'Ajuste'),
    empleado_id INT,
    observaciones TEXT,
    FOREIGN KEY (producto_id) REFERENCES PRODUCTO(cod_producto),
    FOREIGN KEY (movimiento_id) REFERENCES INVENTARIO_MOVIMIENTO(cod_movimiento),
    FOREIGN KEY (empleado_id) REFERENCES EMPLEADO(cod_empleado),
    CONSTRAINT chk_cantidad CHECK (cantidad >= 0),
    CONSTRAINT chk_stock CHECK (stock_anterior >= 0 AND stock_nuevo >= 0)
);

-- Tabla Recibo
CREATE TABLE RECIBO (
    cod_recibo INT PRIMARY KEY AUTO_INCREMENT,
    pedido_id INT UNIQUE,
    fecha_emision DATETIME DEFAULT CURRENT_TIMESTAMP,
    monto_total DECIMAL(10,2),
    metodo_pago_id INT,
    codigo_autorizacion VARCHAR(50),
    detalle_extra TEXT,
    FOREIGN KEY (pedido_id) REFERENCES PEDIDO(cod_pedido),
    FOREIGN KEY (metodo_pago_id) REFERENCES METODO_PAGO(cod_metodo),
    CONSTRAINT chk_monto_total CHECK (monto_total >= 0)
);

-- Tabla Reporte Semanal
CREATE TABLE REPORTE_SEMANAL (
    cod_reporte INT PRIMARY KEY AUTO_INCREMENT,
    fecha_inicio DATE,
    fecha_fin DATE,
    total_pedidos INT,
    pedidos_completados INT,
    pedidos_cancelados INT,
    monto_total DECIMAL(10,2),
    productos_vendidos INT,
    fecha_generado DATETIME DEFAULT CURRENT_TIMESTAMP,
    generado_por INT,
    observaciones TEXT,
    FOREIGN KEY (generado_por) REFERENCES EMPLEADO(cod_empleado)
);