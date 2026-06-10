CREATE TABLE users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NULL,
    profile_image_url VARCHAR(500) NULL,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    failed_login_attempts INT NOT NULL DEFAULT 0,
    last_login_at DATETIME NULL,
    status ENUM(
        'ACTIVE',
        'INACTIVE',
        'LOCKED',
        'SUSPENDED'
    ) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_email (email),
    UNIQUE KEY uk_users_phone (phone),
    INDEX idx_users_status (status),
    INDEX idx_users_created (created_at)
) ENGINE = InnoDB;

CREATE TABLE roles (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_roles_name (name)
) ENGINE = InnoDB;

CREATE TABLE permissions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    code VARCHAR(150) NOT NULL,
    description VARCHAR(255) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_permissions_code (code)
) ENGINE = InnoDB;

CREATE TABLE user_roles (
    user_id BIGINT UNSIGNED NOT NULL,
    role_id BIGINT UNSIGNED NOT NULL,
    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles (id)
) ENGINE = InnoDB;

CREATE TABLE role_permissions (
    role_id BIGINT UNSIGNED NOT NULL,
    permission_id BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES roles (id),
    CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id) REFERENCES permissions (id)
) ENGINE = InnoDB;

CREATE TABLE user_sessions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    refresh_token_hash VARCHAR(255) NOT NULL,
    device_name VARCHAR(255) NULL,
    ip_address VARCHAR(100) NULL,
    user_agent TEXT NULL,
    expires_at DATETIME NOT NULL,
    revoked_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_session_user (user_id),
    CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE = InnoDB;

CREATE TABLE otp_verifications (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    purpose ENUM(
        'PHONE_VERIFICATION',
        'LOGIN',
        'PASSWORD_RESET'
    ) NOT NULL,
    expires_at DATETIME NOT NULL,
    verified_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_otp_user (user_id),
    CONSTRAINT fk_otp_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE = InnoDB;

CREATE TABLE restaurants (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    owner_user_id BIGINT UNSIGNED NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    legal_business_name VARCHAR(255) NOT NULL,
    primary_phone VARCHAR(20) NOT NULL,
    primary_email VARCHAR(255) NOT NULL,
    logo_url VARCHAR(500) NULL,
    cover_image_url VARCHAR(500) NULL,
    description VARCHAR(300) NULL,
    status ENUM(
        'PENDING_VERIFICATION',
        'APPROVED',
        'REJECTED',
        'SUSPENDED'
    ) NOT NULL DEFAULT 'PENDING_VERIFICATION',
    approved_by BIGINT UNSIGNED NULL,
    approved_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_restaurants_gstin (gstin),
    UNIQUE KEY uk_restaurants_fssai (fssai_license_number),
    INDEX idx_restaurants_owner (owner_user_id),
    INDEX idx_restaurants_status (status),
    CONSTRAINT fk_restaurant_owner FOREIGN KEY (owner_user_id) REFERENCES users (id)
) ENGINE = InnoDB;

CREATE TABLE restaurant_branches (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    restaurant_id BIGINT UNSIGNED NOT NULL,
    branch_name VARCHAR(255) NOT NULL,
    gstin VARCHAR(20) NOT NULL,
    fssai_license_number VARCHAR(50) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    address_line_1 VARCHAR(255) NOT NULL,
    address_line_2 VARCHAR(255) NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    minimum_order_value DECIMAL(10, 2) NOT NULL DEFAULT 0,
    delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    PRIMARY KEY (id),
    INDEX idx_branch_restaurant (restaurant_id),
    INDEX idx_branch_city (city),
    CONSTRAINT fk_branch_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)
) ENGINE = InnoDB;

CREATE TABLE restaurant_documents (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    restaurant_id BIGINT UNSIGNED NOT NULL,
    document_type ENUM(
        'GSTIN',
        'FSSAI',
        'BANK_PROOF',
        'BUSINESS_LICENSE'
    ) NOT NULL,
    document_url VARCHAR(500) NOT NULL,
    verification_status ENUM(
        'PENDING',
        'APPROVED',
        'REJECTED'
    ) NOT NULL DEFAULT 'PENDING',
    verified_by BIGINT UNSIGNED NULL,
    verified_at DATETIME NULL,
    rejection_reason VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_doc_restaurant (restaurant_id),
    CONSTRAINT fk_doc_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)
) ENGINE = InnoDB;

CREATE TABLE restaurant_operating_hours (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    branch_id BIGINT UNSIGNED NOT NULL,
    day_of_week TINYINT NOT NULL,
    opening_time TIME NULL,
    closing_time TIME NULL,
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id),
    UNIQUE KEY uk_branch_day (branch_id, day_of_week),
    CONSTRAINT fk_hours_branch FOREIGN KEY (branch_id) REFERENCES restaurant_branches (id)
) ENGINE = InnoDB;

CREATE TABLE restaurant_delivery_zones (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    branch_id BIGINT UNSIGNED NOT NULL,
    radius_km DECIMAL(5, 2) NOT NULL,
    minimum_delivery_time_minutes INT NOT NULL,
    maximum_delivery_time_minutes INT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_zone_branch (branch_id),
    CONSTRAINT fk_zone_branch FOREIGN KEY (branch_id) REFERENCES restaurant_branches (id)
) ENGINE = InnoDB;

CREATE TABLE restaurant_staff (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    branch_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    designation ENUM(
        'MANAGER',
        'KITCHEN_STAFF',
        'CASHIER',
        'SUPERVISOR'
    ) NOT NULL,
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_staff_branch_user (branch_id, user_id),
    INDEX idx_staff_user (user_id),
    CONSTRAINT fk_staff_branch FOREIGN KEY (branch_id) REFERENCES restaurant_branches (id),
    CONSTRAINT fk_staff_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE = InnoDB;

CREATE TABLE menu_categories (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    branch_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(255) NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_category_branch (branch_id),
    CONSTRAINT fk_category_branch FOREIGN KEY (branch_id) REFERENCES restaurant_branches (id)
) ENGINE = InnoDB;

CREATE TABLE menu_items (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    category_id BIGINT UNSIGNED NOT NULL,
    sku VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(200) NULL,
    image_url VARCHAR(500) NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    food_type ENUM('VEG', 'NON_VEG', 'VEGAN') NOT NULL,
    is_bestseller BOOLEAN NOT NULL DEFAULT FALSE,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_menu_sku (sku),
    INDEX idx_menu_category (category_id),
    INDEX idx_menu_available (is_available),
    CONSTRAINT fk_menu_category FOREIGN KEY (category_id) REFERENCES menu_categories (id)
) ENGINE = InnoDB;

CREATE TABLE modifier_groups (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    branch_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(150) NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    min_selection INT NOT NULL DEFAULT 0,
    max_selection INT NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_modifier_branch (branch_id),
    CONSTRAINT fk_modifier_branch FOREIGN KEY (branch_id) REFERENCES restaurant_branches (id)
) ENGINE = InnoDB;

CREATE TABLE modifier_options (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    modifier_group_id BIGINT UNSIGNED NOT NULL,
    option_name VARCHAR(150) NOT NULL,
    additional_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    display_order INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_option_group (modifier_group_id),
    CONSTRAINT fk_option_group FOREIGN KEY (modifier_group_id) REFERENCES modifier_groups (id)
) ENGINE = InnoDB;

CREATE TABLE menu_item_modifier_groups (
    menu_item_id BIGINT UNSIGNED NOT NULL,
    modifier_group_id BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (
        menu_item_id,
        modifier_group_id
    ),
    CONSTRAINT fk_mimg_item FOREIGN KEY (menu_item_id) REFERENCES menu_items (id),
    CONSTRAINT fk_mimg_group FOREIGN KEY (modifier_group_id) REFERENCES modifier_groups (id)
) ENGINE = InnoDB;

CREATE TABLE menu_item_availability (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    menu_item_id BIGINT UNSIGNED NOT NULL,
    day_of_week TINYINT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_availability_item (menu_item_id),
    CONSTRAINT fk_availability_item FOREIGN KEY (menu_item_id) REFERENCES menu_items (id)
) ENGINE = InnoDB;

CREATE TABLE menu_item_images (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    menu_item_id BIGINT UNSIGNED NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_item_image (menu_item_id),
    CONSTRAINT fk_item_image FOREIGN KEY (menu_item_id) REFERENCES menu_items (id)
) ENGINE = InnoDB;

CREATE TABLE customer_profiles (
    user_id BIGINT UNSIGNED NOT NULL,
    profile_photo_url VARCHAR(500) NULL,
    loyalty_points_balance INT NOT NULL DEFAULT 0,
    referral_code VARCHAR(20) NOT NULL,
    referred_by_user_id BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    UNIQUE KEY uk_customer_referral (referral_code),
    CONSTRAINT fk_customer_profile_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_customer_profile_referrer FOREIGN KEY (referred_by_user_id) REFERENCES users (id)
) ENGINE = InnoDB;

CREATE TABLE customer_addresses (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    customer_user_id BIGINT UNSIGNED NOT NULL,
    label ENUM('HOME', 'WORK', 'OTHER') NOT NULL,
    contact_name VARCHAR(150) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    address_line_1 VARCHAR(255) NOT NULL,
    address_line_2 VARCHAR(255) NULL,
    landmark VARCHAR(255) NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_customer_address_user (customer_user_id),
    CONSTRAINT fk_customer_address_user FOREIGN KEY (customer_user_id) REFERENCES users (id)
) ENGINE = InnoDB;

CREATE TABLE customer_preferences (
    customer_user_id BIGINT UNSIGNED NOT NULL,
    vegetarian BOOLEAN NOT NULL DEFAULT FALSE,
    vegan BOOLEAN NOT NULL DEFAULT FALSE,
    gluten_free BOOLEAN NOT NULL DEFAULT FALSE,
    halal BOOLEAN NOT NULL DEFAULT FALSE,
    jain BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (customer_user_id),
    CONSTRAINT fk_preferences_customer FOREIGN KEY (customer_user_id) REFERENCES users (id)
) ENGINE = InnoDB;

CREATE TABLE customer_notification_preferences (
    customer_user_id BIGINT UNSIGNED NOT NULL,
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sms_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    marketing_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (customer_user_id),
    CONSTRAINT fk_notification_customer FOREIGN KEY (customer_user_id) REFERENCES users (id)
) ENGINE = InnoDB;

CREATE TABLE customer_payment_methods (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    customer_user_id BIGINT UNSIGNED NOT NULL,
    provider ENUM('RAZORPAY', 'STRIPE') NOT NULL,
    payment_type ENUM('CARD', 'UPI') NOT NULL,
    gateway_token VARCHAR(255) NOT NULL,
    masked_identifier VARCHAR(100) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_payment_customer (customer_user_id),
    CONSTRAINT fk_payment_customer FOREIGN KEY (customer_user_id) REFERENCES users (id)
) ENGINE = InnoDB;

CREATE TABLE customer_favorite_restaurants (
    customer_user_id BIGINT UNSIGNED NOT NULL,
    restaurant_id BIGINT UNSIGNED NOT NULL,
    added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (
        customer_user_id,
        restaurant_id
    ),
    CONSTRAINT fk_favorite_customer FOREIGN KEY (customer_user_id) REFERENCES users (id),
    CONSTRAINT fk_favorite_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)
) ENGINE = InnoDB;

CREATE TABLE carts (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    customer_user_id BIGINT UNSIGNED NOT NULL,
    restaurant_branch_id BIGINT UNSIGNED NOT NULL,
    status ENUM(
        'ACTIVE',
        'CHECKED_OUT',
        'ABANDONED'
    ) NOT NULL DEFAULT 'ACTIVE',
    subtotal_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    last_activity_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_cart_customer (customer_user_id),
    INDEX idx_cart_branch (restaurant_branch_id),
    CONSTRAINT fk_cart_customer FOREIGN KEY (customer_user_id) REFERENCES users (id),
    CONSTRAINT fk_cart_branch FOREIGN KEY (restaurant_branch_id) REFERENCES restaurant_branches (id)
) ENGINE = InnoDB;

CREATE TABLE cart_items (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    cart_id BIGINT UNSIGNED NOT NULL,
    menu_item_id BIGINT UNSIGNED NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    line_total DECIMAL(10, 2) NOT NULL,
    special_instructions VARCHAR(150) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_cart_item_cart (cart_id),
    CONSTRAINT fk_cart_item_cart FOREIGN KEY (cart_id) REFERENCES carts (id),
    CONSTRAINT fk_cart_item_menu FOREIGN KEY (menu_item_id) REFERENCES menu_items (id)
) ENGINE = InnoDB;

CREATE TABLE cart_item_modifiers (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    cart_item_id BIGINT UNSIGNED NOT NULL,
    modifier_option_id BIGINT UNSIGNED NOT NULL,
    additional_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_modifier_cart_item (cart_item_id),
    CONSTRAINT fk_cart_modifier_item FOREIGN KEY (cart_item_id) REFERENCES cart_items (id),
    CONSTRAINT fk_cart_modifier_option FOREIGN KEY (modifier_option_id) REFERENCES modifier_options (id)
) ENGINE = InnoDB;

CREATE TABLE checkout_sessions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    cart_id BIGINT UNSIGNED NOT NULL,
    customer_user_id BIGINT UNSIGNED NOT NULL,
    address_id BIGINT UNSIGNED NOT NULL,
    payment_method_id BIGINT UNSIGNED NULL,
    coupon_id BIGINT UNSIGNED NULL,
    delivery_type ENUM('ASAP', 'SCHEDULED') NOT NULL,
    scheduled_for DATETIME NULL,
    estimated_delivery_minutes INT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_checkout_customer (customer_user_id),
    CONSTRAINT fk_checkout_cart FOREIGN KEY (cart_id) REFERENCES carts (id),
    CONSTRAINT fk_checkout_customer FOREIGN KEY (customer_user_id) REFERENCES users (id),
    CONSTRAINT fk_checkout_address FOREIGN KEY (address_id) REFERENCES customer_addresses (id)
) ENGINE = InnoDB;

CREATE TABLE cart_price_breakdowns (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    cart_id BIGINT UNSIGNED NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) NOT NULL,
    delivery_fee DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    calculated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_breakdown_cart (cart_id),
    CONSTRAINT fk_breakdown_cart FOREIGN KEY (cart_id) REFERENCES carts (id)
) ENGINE = InnoDB;

CREATE TABLE orders (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_number VARCHAR(50) NOT NULL,
    customer_user_id BIGINT UNSIGNED NOT NULL,
    restaurant_id BIGINT UNSIGNED NOT NULL,
    branch_id BIGINT UNSIGNED NOT NULL,
    checkout_session_id BIGINT UNSIGNED NULL,
    order_status ENUM(
        'PLACED',
        'REJECTED',
        'ACCEPTED',
        'PREPARING',
        'READY_FOR_PICKUP',
        'PICKED_UP',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED'
    ) NOT NULL,
    payment_status ENUM(
        'PENDING',
        'PAID',
        'FAILED',
        'REFUNDED',
        'PARTIALLY_REFUNDED'
    ) NOT NULL,
    subtotal_amount DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) NOT NULL,
    delivery_fee DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    estimated_delivery_at DATETIME NULL,
    delivered_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_order_number (order_number),
    INDEX idx_order_customer (customer_user_id),
    INDEX idx_order_branch (branch_id),
    INDEX idx_order_status (order_status),
    CONSTRAINT fk_order_customer FOREIGN KEY (customer_user_id) REFERENCES users (id),
    CONSTRAINT fk_order_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants (id),
    CONSTRAINT fk_order_branch FOREIGN KEY (branch_id) REFERENCES restaurant_branches (id)
) ENGINE = InnoDB;

CREATE TABLE order_addresses (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id BIGINT UNSIGNED NOT NULL,
    recipient_name VARCHAR(150) NOT NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    address_line_1 VARCHAR(255) NOT NULL,
    address_line_2 VARCHAR(255) NULL,
    landmark VARCHAR(255) NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_order_address (order_id),
    CONSTRAINT fk_order_address FOREIGN KEY (order_id) REFERENCES orders (id)
) ENGINE = InnoDB;

CREATE TABLE order_items (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id BIGINT UNSIGNED NOT NULL,
    menu_item_id BIGINT UNSIGNED NULL,
    item_name VARCHAR(255) NOT NULL,
    item_description VARCHAR(500) NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    line_total DECIMAL(10, 2) NOT NULL,
    special_instructions VARCHAR(150) NULL,
    PRIMARY KEY (id),
    INDEX idx_order_item_order (order_id),
    CONSTRAINT fk_order_item_order FOREIGN KEY (order_id) REFERENCES orders (id)
) ENGINE = InnoDB;

CREATE TABLE order_item_modifiers (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_item_id BIGINT UNSIGNED NOT NULL,
    modifier_name VARCHAR(150) NOT NULL,
    option_name VARCHAR(150) NOT NULL,
    additional_price DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_order_modifier (order_item_id),
    CONSTRAINT fk_order_modifier_item FOREIGN KEY (order_item_id) REFERENCES order_items (id)
) ENGINE = InnoDB;

CREATE TABLE order_status_history (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id BIGINT UNSIGNED NOT NULL,
    status ENUM(
        'PLACED',
        'REJECTED',
        'ACCEPTED',
        'PREPARING',
        'READY_FOR_PICKUP',
        'PICKED_UP',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED'
    ) NOT NULL,
    changed_by_user_id BIGINT UNSIGNED NULL,
    remarks VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_status_order (order_id),
    CONSTRAINT fk_status_order FOREIGN KEY (order_id) REFERENCES orders (id)
) ENGINE = InnoDB;

CREATE TABLE order_cancellations (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id BIGINT UNSIGNED NOT NULL,
    cancelled_by_user_id BIGINT UNSIGNED NOT NULL,
    cancellation_reason VARCHAR(500) NOT NULL,
    refund_eligible BOOLEAN NOT NULL,
    refund_amount DECIMAL(10, 2) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_cancel_order (order_id),
    CONSTRAINT fk_cancel_order FOREIGN KEY (order_id) REFERENCES orders (id)
) ENGINE = InnoDB;

CREATE TABLE order_events (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id BIGINT UNSIGNED NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_event_order (order_id),
    CONSTRAINT fk_event_order FOREIGN KEY (order_id) REFERENCES orders (id)
) ENGINE = InnoDB;

CREATE TABLE payments (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id BIGINT UNSIGNED NOT NULL,
    payment_provider ENUM(
        'RAZORPAY',
        'STRIPE',
        'PAYPAL',
        'COD'
    ) NOT NULL,
    provider_order_id VARCHAR(255) NULL,
    provider_payment_id VARCHAR(255) NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'INR',
    status ENUM(
        'INITIATED',
        'AUTHORIZED',
        'CAPTURED',
        'FAILED',
        'REFUNDED',
        'PARTIALLY_REFUNDED'
    ) NOT NULL,
    failure_reason VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_payment_order (order_id),
    INDEX idx_payment_status (status),
    CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES orders (id)
) ENGINE = InnoDB;

CREATE TABLE payment_events (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    payment_id BIGINT UNSIGNED NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSON NULL,
    received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_payment_event (payment_id),
    CONSTRAINT fk_payment_event FOREIGN KEY (payment_id) REFERENCES payments (id)
) ENGINE = InnoDB;

CREATE TABLE refunds (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    payment_id BIGINT UNSIGNED NOT NULL,
    order_id BIGINT UNSIGNED NOT NULL,
    refund_reference VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    reason VARCHAR(500) NOT NULL,
    status ENUM(
        'INITIATED',
        'PROCESSING',
        'COMPLETED',
        'FAILED'
    ) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_refund_order (order_id),
    CONSTRAINT fk_refund_payment FOREIGN KEY (payment_id) REFERENCES payments (id),
    CONSTRAINT fk_refund_order FOREIGN KEY (order_id) REFERENCES orders (id)
) ENGINE = InnoDB;

CREATE TABLE coupons (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL,
    coupon_type ENUM(
        'PERCENTAGE',
        'FLAT',
        'FREE_DELIVERY',
        'BOGO'
    ) NOT NULL,
    value DECIMAL(10, 2) NOT NULL,
    minimum_order_amount DECIMAL(10, 2) NULL,
    maximum_discount_amount DECIMAL(10, 2) NULL,
    usage_limit INT NULL,
    per_user_limit INT NULL,
    valid_from DATETIME NOT NULL,
    valid_until DATETIME NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_coupon_code (code)
) ENGINE = InnoDB;

CREATE TABLE coupon_restaurants (
    coupon_id BIGINT UNSIGNED NOT NULL,
    restaurant_id BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (coupon_id, restaurant_id),
    FOREIGN KEY (coupon_id) REFERENCES coupons (id),
    FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)
) ENGINE = InnoDB;

CREATE TABLE coupon_usages (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    coupon_id BIGINT UNSIGNED NOT NULL,
    customer_user_id BIGINT UNSIGNED NOT NULL,
    order_id BIGINT UNSIGNED NOT NULL,
    discount_amount DECIMAL(10, 2) NOT NULL,
    used_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_coupon_usage_coupon (coupon_id),
    INDEX idx_coupon_usage_customer (customer_user_id),
    FOREIGN KEY (coupon_id) REFERENCES coupons (id),
    FOREIGN KEY (customer_user_id) REFERENCES users (id),
    FOREIGN KEY (order_id) REFERENCES orders (id)
) ENGINE = InnoDB;

CREATE TABLE loyalty_accounts (
    customer_user_id BIGINT UNSIGNED NOT NULL,
    current_balance INT NOT NULL DEFAULT 0,
    PRIMARY KEY (customer_user_id),
    FOREIGN KEY (customer_user_id) REFERENCES users (id)
) ENGINE = InnoDB;

CREATE TABLE loyalty_transactions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    customer_user_id BIGINT UNSIGNED NOT NULL,
    order_id BIGINT UNSIGNED NULL,
    transaction_type ENUM(
        'EARN',
        'REDEEM',
        'ADJUSTMENT'
    ) NOT NULL,
    points INT NOT NULL,
    description VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_loyalty_customer (customer_user_id),
    FOREIGN KEY (customer_user_id) REFERENCES users (id)
) ENGINE = InnoDB;

CREATE TABLE referrals (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    referrer_user_id BIGINT UNSIGNED NOT NULL,
    referred_user_id BIGINT UNSIGNED NOT NULL,
    first_order_id BIGINT UNSIGNED NULL,
    reward_points INT NOT NULL DEFAULT 0,
    rewarded_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_referred_user (referred_user_id),
    FOREIGN KEY (referrer_user_id) REFERENCES users (id),
    FOREIGN KEY (referred_user_id) REFERENCES users (id)
) ENGINE = InnoDB;

CREATE TABLE delivery_partners (
    user_id BIGINT UNSIGNED NOT NULL,
    vehicle_type ENUM(
        'BICYCLE',
        'MOTORCYCLE',
        'CAR'
    ) NOT NULL,
    vehicle_registration_number VARCHAR(50) NOT NULL,
    status ENUM(
        'PENDING_VERIFICATION',
        'ACTIVE',
        'SUSPENDED'
    ) NOT NULL DEFAULT 'PENDING_VERIFICATION',
    is_online BOOLEAN NOT NULL DEFAULT FALSE,
    average_rating DECIMAL(3, 2) NOT NULL DEFAULT 0,
    total_completed_deliveries INT NOT NULL DEFAULT 0,
    joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE = InnoDB;

CREATE TABLE delivery_partner_documents (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    partner_user_id BIGINT UNSIGNED NOT NULL,
    document_type ENUM(
        'AADHAR',
        'PAN',
        'DRIVING_LICENSE',
        'VEHICLE_RC'
    ) NOT NULL,
    document_url VARCHAR(500) NOT NULL,
    verification_status ENUM(
        'PENDING',
        'APPROVED',
        'REJECTED'
    ) NOT NULL DEFAULT 'PENDING',
    verified_by BIGINT UNSIGNED NULL,
    verified_at DATETIME NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (partner_user_id) REFERENCES delivery_partners (user_id)
) ENGINE = InnoDB;

CREATE TABLE partner_status_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    partner_user_id BIGINT UNSIGNED NOT NULL,
    status ENUM('ONLINE', 'OFFLINE') NOT NULL,
    changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_status_partner (partner_user_id),
    FOREIGN KEY (partner_user_id) REFERENCES delivery_partners (user_id)
) ENGINE = InnoDB;

CREATE TABLE delivery_assignments (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id BIGINT UNSIGNED NOT NULL,
    partner_user_id BIGINT UNSIGNED NULL,
    assigned_by_user_id BIGINT UNSIGNED NULL,
    assignment_type ENUM('AUTO', 'MANUAL') NOT NULL,
    status ENUM(
        'ASSIGNED',
        'ACCEPTED',
        'DECLINED',
        'REASSIGNED',
        'COMPLETED'
    ) NOT NULL,
    assigned_at DATETIME NOT NULL,
    accepted_at DATETIME NULL,
    completed_at DATETIME NULL,
    PRIMARY KEY (id),
    INDEX idx_assignment_order (order_id),
    INDEX idx_assignment_partner (partner_user_id),
    FOREIGN KEY (order_id) REFERENCES orders (id),
    FOREIGN KEY (partner_user_id) REFERENCES delivery_partners (user_id)
) ENGINE = InnoDB;

CREATE TABLE delivery_tracking_points (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    assignment_id BIGINT UNSIGNED NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    recorded_at DATETIME NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_tracking_assignment (assignment_id, recorded_at),
    FOREIGN KEY (assignment_id) REFERENCES delivery_assignments (id)
) ENGINE = InnoDB;

CREATE TABLE delivery_events (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id BIGINT UNSIGNED NOT NULL,
    partner_user_id BIGINT UNSIGNED NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_delivery_event_order (order_id),
    FOREIGN KEY (order_id) REFERENCES orders (id)
) ENGINE = InnoDB;

CREATE TABLE partner_earnings (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    partner_user_id BIGINT UNSIGNED NOT NULL,
    order_id BIGINT UNSIGNED NOT NULL,
    base_earning DECIMAL(10, 2) NOT NULL,
    incentive_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_earning DECIMAL(10, 2) NOT NULL,
    status ENUM('PENDING', 'PAYABLE', 'PAID') NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_earning_partner (partner_user_id),
    FOREIGN KEY (partner_user_id) REFERENCES delivery_partners (user_id),
    FOREIGN KEY (order_id) REFERENCES orders (id)
) ENGINE = InnoDB;

CREATE TABLE reviews (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id BIGINT UNSIGNED NOT NULL,
    customer_user_id BIGINT UNSIGNED NOT NULL,
    restaurant_id BIGINT UNSIGNED NOT NULL,
    food_rating TINYINT NOT NULL,
    delivery_rating TINYINT NOT NULL,
    packaging_rating TINYINT NOT NULL,
    overall_rating DECIMAL(3, 2) NOT NULL,
    review_text VARCHAR(500) NULL,
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_review_order (order_id),
    INDEX idx_review_restaurant (restaurant_id),
    FOREIGN KEY (order_id) REFERENCES orders (id),
    FOREIGN KEY (customer_user_id) REFERENCES users (id),
    FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)
) ENGINE = InnoDB;

CREATE TABLE review_images (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    review_id BIGINT UNSIGNED NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_review_image (review_id),
    FOREIGN KEY (review_id) REFERENCES reviews (id)
) ENGINE = InnoDB;

CREATE TABLE review_replies (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    review_id BIGINT UNSIGNED NOT NULL,
    replied_by_user_id BIGINT UNSIGNED NOT NULL,
    reply_text VARCHAR(1000) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_review_reply (review_id),
    FOREIGN KEY (review_id) REFERENCES reviews (id),
    FOREIGN KEY (replied_by_user_id) REFERENCES users (id)
) ENGINE = InnoDB;

CREATE TABLE support_tickets (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    ticket_number VARCHAR(50) NOT NULL,
    order_id BIGINT UNSIGNED NOT NULL,
    customer_user_id BIGINT UNSIGNED NOT NULL,
    assigned_admin_user_id BIGINT UNSIGNED NULL,
    category ENUM(
        'MISSING_ITEM',
        'WRONG_ITEM',
        'POOR_QUALITY',
        'LATE_DELIVERY',
        'REFUND_REQUEST',
        'OTHER'
    ) NOT NULL,
    priority ENUM(
        'LOW',
        'MEDIUM',
        'HIGH',
        'CRITICAL'
    ) NOT NULL,
    status ENUM(
        'OPEN',
        'IN_PROGRESS',
        'RESOLVED',
        'CLOSED'
    ) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_ticket_number (ticket_number),
    INDEX idx_ticket_order (order_id),
    FOREIGN KEY (order_id) REFERENCES orders (id),
    FOREIGN KEY (customer_user_id) REFERENCES users (id)
) ENGINE = InnoDB;

CREATE TABLE support_messages (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    ticket_id BIGINT UNSIGNED NOT NULL,
    sender_user_id BIGINT UNSIGNED NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_ticket_message (ticket_id),
    FOREIGN KEY (ticket_id) REFERENCES support_tickets (id),
    FOREIGN KEY (sender_user_id) REFERENCES users (id)
) ENGINE = InnoDB;

CREATE TABLE support_attachments (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    ticket_id BIGINT UNSIGNED NOT NULL,
    uploaded_by_user_id BIGINT UNSIGNED NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_ticket_attachment (ticket_id),
    FOREIGN KEY (ticket_id) REFERENCES support_tickets (id),
    FOREIGN KEY (uploaded_by_user_id) REFERENCES users (id)
) ENGINE = InnoDB;

CREATE TABLE restaurant_payouts (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    restaurant_id BIGINT UNSIGNED NOT NULL,
    payout_reference VARCHAR(100) NOT NULL,
    payout_period_start DATETIME NOT NULL,
    payout_period_end DATETIME NOT NULL,
    gross_amount DECIMAL(12, 2) NOT NULL,
    commission_amount DECIMAL(12, 2) NOT NULL,
    tax_amount DECIMAL(12, 2) NOT NULL,
    net_amount DECIMAL(12, 2) NOT NULL,
    status ENUM(
        'PENDING',
        'PROCESSING',
        'PAID',
        'FAILED'
    ) NOT NULL,
    paid_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_restaurant_payout_ref (payout_reference),
    FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)
) ENGINE = InnoDB;

CREATE TABLE restaurant_payout_items (
    payout_id BIGINT UNSIGNED NOT NULL,
    order_id BIGINT UNSIGNED NOT NULL,
    restaurant_share DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY (payout_id, order_id),
    FOREIGN KEY (payout_id) REFERENCES restaurant_payouts (id),
    FOREIGN KEY (order_id) REFERENCES orders (id)
) ENGINE = InnoDB;

CREATE TABLE partner_payouts (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    partner_user_id BIGINT UNSIGNED NOT NULL,
    payout_reference VARCHAR(100) NOT NULL,
    gross_amount DECIMAL(12, 2) NOT NULL,
    incentive_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    net_amount DECIMAL(12, 2) NOT NULL,
    status ENUM(
        'PENDING',
        'PROCESSING',
        'PAID',
        'FAILED'
    ) NOT NULL,
    paid_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_partner_payout_ref (payout_reference),
    FOREIGN KEY (partner_user_id) REFERENCES delivery_partners (user_id)
) ENGINE = InnoDB;

CREATE TABLE partner_payout_items (
    payout_id BIGINT UNSIGNED NOT NULL,
    earning_id BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (payout_id, earning_id),
    FOREIGN KEY (payout_id) REFERENCES partner_payouts (id),
    FOREIGN KEY (earning_id) REFERENCES partner_earnings (id)
) ENGINE = InnoDB;

CREATE TABLE audit_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    actor_user_id BIGINT UNSIGNED NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id BIGINT UNSIGNED NOT NULL,
    action VARCHAR(100) NOT NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    ip_address VARCHAR(100) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_audit_actor (actor_user_id),
    INDEX idx_audit_entity (entity_type, entity_id),
    FOREIGN KEY (actor_user_id) REFERENCES users (id)
) ENGINE = InnoDB;

CREATE TABLE system_configurations (
    config_key VARCHAR(150) NOT NULL,
    config_value TEXT NOT NULL,
    description VARCHAR(500) NULL,
    updated_by BIGINT UNSIGNED NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (config_key),
    FOREIGN KEY (updated_by) REFERENCES users (id)
) ENGINE = InnoDB;

CREATE TABLE report_exports (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    generated_by_user_id BIGINT UNSIGNED NOT NULL,
    report_type VARCHAR(100) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (generated_by_user_id) REFERENCES users (id)
) ENGINE = InnoDB;