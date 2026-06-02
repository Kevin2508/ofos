create database quick_bites_db;

CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(191) UNIQUE NULL,
    mobile_number VARCHAR(20) UNIQUE NULL,
    password_hash VARCHAR(255) NULL,
    role ENUM('customer', 'restaurant_owner', 'restaurant_staff', 'delivery_partner', 'fleet_manager', 'platform_admin', 'finance_manager') NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    failed_login_attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
    locked_until TIMESTAMP NULL DEFAULT NULL, -- Security locking threshold column
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL, -- Enables logical soft-deletes
    INDEX idx_user_role (role),
    INDEX idx_auth_lookup (email, mobile_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_sessions (
    id CHAR(36) PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    device_name VARCHAR(255),
    browser VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    last_activity_at DATETIME,
    expires_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id)
    REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_social_accounts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    provider ENUM('google', 'facebook') NOT NULL,
    provider_user_id VARCHAR(191) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_provider_uid (provider, provider_user_id),
    CONSTRAINT fk_social_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE auth_tokens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    refresh_token_hash VARCHAR(255) NOT NULL,
    device_info VARCHAR(255) NULL,
    ip_address VARCHAR(45) NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL, -- Enforces 30-day session expiry (CUST-FR-007)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_token_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE otp_verifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    mobile_number VARCHAR(20) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    purpose ENUM('registration', 'login', 'delivery_confirmation') NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL, -- Evaluates the 60-second limit (CUST-FR-002)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_mobile_otp (mobile_number, otp_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE customers (
    user_id BIGINT UNSIGNED PRIMARY KEY,
    display_name VARCHAR(100) NOT NULL,
    profile_photo_url VARCHAR(255) NULL,
    dietary_preference ENUM('vegetarian', 'vegan', 'gluten-free', 'halal', 'jain') NULL,
    communication_email BOOLEAN NOT NULL DEFAULT TRUE,
    communication_sms BOOLEAN NOT NULL DEFAULT TRUE,
    communication_push BOOLEAN NOT NULL DEFAULT TRUE,
    loyalty_points_balance INT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_customer_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE customer_addresses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT UNSIGNED NOT NULL,
    label ENUM('home', 'work', 'other') NOT NULL DEFAULT 'home',
    address_line_1 VARCHAR(255) NOT NULL,
    address_line_2 VARCHAR(255) NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    coordinates POINT NOT NULL SRID 4326,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    SPATIAL INDEX idx_cust_coordinates (coordinates),
    CONSTRAINT fk_address_customer FOREIGN KEY (customer_id) REFERENCES customers (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE customer_payment_methods (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT UNSIGNED NOT NULL,
    provider ENUM(
        'razorpay',
        'stripe',
        'paytm',
        'phonepe'
    ) NOT NULL,
    payment_type ENUM(
        'card',
        'upi',
        'wallet'
    ) NOT NULL,
    provider_token VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    card_brand VARCHAR(50) NULL,
    card_last4 CHAR(4) NULL,
    expiry_month TINYINT UNSIGNED NULL,
    expiry_year SMALLINT UNSIGNED NULL,
    upi_id VARCHAR(255) NULL,
    is_default BOOLEAN DEFAULT FALSE,
    status ENUM(
        'active',
        'expired',
        'removed'
    ) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    FOREIGN KEY (customer_id)
        REFERENCES customers(user_id),
    INDEX idx_customer(customer_id),
    INDEX idx_customer_default(
        customer_id,
        is_default
    ),
    INDEX idx_provider(provider)

);

CREATE TABLE customer_loyalty_transactions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT UNSIGNED NOT NULL,
    order_id BIGINT UNSIGNED NULL,
    reference_type ENUM(
        'order_earned',
        'order_redeemed',
        'referral_bonus',
        'admin_adjustment',
        'refund_reversal',
        'signup_bonus',
        'promotion_bonus'
    ) NOT NULL,
    reference_id BIGINT UNSIGNED NULL,
    transaction_type ENUM(
        'credit',
        'debit'
    ) NOT NULL,
    points INT NOT NULL,
    balance_before INT NOT NULL,
    balance_after INT NOT NULL,
    remarks VARCHAR(255) NULL,
    expires_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id)
        REFERENCES customers(user_id),
    FOREIGN KEY (applied_coupon_id)
REFERENCES coupons(id),
    INDEX idx_customer(customer_id),
    INDEX idx_order(order_id),
    INDEX idx_created(created_at)
);

CREATE TABLE customer_referrals (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    referrer_customer_id BIGINT UNSIGNED NOT NULL,
    referred_customer_id BIGINT UNSIGNED NOT NULL,
    referral_code VARCHAR(20) NOT NULL,
    first_order_id BIGINT UNSIGNED NULL,
    referral_status ENUM(
        'registered',
        'first_order_completed',
        'reward_granted',
        'expired'
    ) DEFAULT 'registered',
    referrer_reward_points INT DEFAULT 0,
    referred_reward_points INT DEFAULT 0,
    reward_granted_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referrer_customer_id)
        REFERENCES customers(user_id),
    FOREIGN KEY (referred_customer_id)
        REFERENCES customers(user_id),
    FOREIGN KEY (first_order_id) REFERENCES orders(id),
    UNIQUE KEY uk_referred_customer(
        referred_customer_id
    ),
    INDEX idx_referrer(
        referrer_customer_id
    ),
    INDEX idx_code(
        referral_code
    )
);

CREATE TABLE restaurant_owners (
    user_id BIGINT UNSIGNED PRIMARY KEY, 
    legal_full_name VARCHAR(150) NOT NULL, 
    company_name VARCHAR(150) NOT NULL,
    contact_number VARCHAR(20) NOT NULL, 
    logo_url VARCHAR(255) NULL, 
    cover_photo_url VARCHAR(255) NULL, 
    restaurant_description VARCHAR(300) NULL,
    cuisine_tags JSON NULL, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_profile_restaurant_owner FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE admin_profiles (
    user_id BIGINT UNSIGNED PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL,
    access_clearance_level TINYINT UNSIGNED NOT NULL DEFAULT 1, -- Custom modular layer authorization rules
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_profile_admin FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE restaurants (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    owner_id BIGINT UNSIGNED NOT NULL,
    business_name VARCHAR(150) NOT NULL,
    gstin VARCHAR(15) UNIQUE NOT NULL,
    fssai_license_number VARCHAR(14) UNIQUE NOT NULL,
    bank_account_number VARCHAR(30) NOT NULL,
    bank_ifsc_code VARCHAR(11) NOT NULL,
	payout_frequency ENUM('daily', 'weekly', 'monthly') NOT NULL DEFAULT 'weekly', 
    kyc_submitted_at TIMESTAMP NULL DEFAULT NULL, 
    verified_at TIMESTAMP NULL DEFAULT NULL,
    verification_status ENUM('pending_verification', 'approved', 'rejected', 'suspended') NOT NULL DEFAULT 'pending_verification',
	commission_percentage DECIMAL(5,2) NOT NULL CHECK (commission_percentage BETWEEN 0.00 AND 100.00),
    minimum_delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    subscription_tier ENUM('standard', 'premium', 'enterprise') NOT NULL DEFAULT 'standard',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_restaurant_owner FOREIGN KEY (owner_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE restaurant_branches (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    restaurant_id BIGINT UNSIGNED NOT NULL,
    branch_name VARCHAR(100) NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    logo_url VARCHAR(255) NULL,
    cover_photo_url VARCHAR(255) NULL,
    description VARCHAR(300) NULL,
    address_text VARCHAR(255) NOT NULL,
    coordinates POINT NOT NULL SRID 4326,
    delivery_radius_polygon POLYGON NOT NULL SRID 4326, -- Geometric service footprint (REST-FR-005)
    minimum_order_value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    delivery_fee_base DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_accepting_orders BOOLEAN NOT NULL DEFAULT TRUE,
    auto_resume_at TIMESTAMP NULL DEFAULT NULL, -- Overload mitigation auto-resume trigger
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    SPATIAL INDEX idx_branch_coordinates (coordinates),
    SPATIAL INDEX idx_branch_polygon (delivery_radius_polygon),
    CONSTRAINT fk_branch_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE restaurant_staff_profiles (
    user_id BIGINT UNSIGNED PRIMARY KEY,
    assigned_branch_id BIGINT UNSIGNED NOT NULL,
    staff_code VARCHAR(30) UNIQUE NOT NULL,
    employment_status ENUM('active', 'on_leave', 'terminated') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_staff_branch (assigned_branch_id),
    CONSTRAINT fk_profile_staff FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_branch_id)
REFERENCES restaurant_branches(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE restaurant_operating_hours (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    branch_id BIGINT UNSIGNED NOT NULL,
    day_of_week ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,
    opening_time TIME NULL, -- NULL implies marked closed for the day
    closing_time TIME NULL,
    CONSTRAINT fk_hours_branch FOREIGN KEY (branch_id) REFERENCES restaurant_branches (id) ON DELETE CASCADE,
    UNIQUE KEY uq_branch_day (branch_id, day_of_week)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE menu_categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    branch_id BIGINT UNSIGNED NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_category_branch FOREIGN KEY (branch_id) REFERENCES restaurant_branches (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE menu_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id BIGINT UNSIGNED NOT NULL,
    sku_identifier VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(200) NULL,
    price DECIMAL(10,2) NOT NULL,
    food_type ENUM('veg', 'non-veg', 'vegan', 'gluten-free') NOT NULL,
    photo_url VARCHAR(255) NULL,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    is_bestseller BOOLEAN NOT NULL DEFAULT FALSE,
    available_from TIME NULL, 
    available_until TIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT fk_item_category FOREIGN KEY (category_id) REFERENCES menu_categories (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE menu_item_modifier_groups (
    menu_item_id BIGINT UNSIGNED NOT NULL,
    modifier_group_id BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (menu_item_id, modifier_group_id),
    CONSTRAINT fk_mimg_item FOREIGN KEY (menu_item_id) REFERENCES menu_items (id) ON DELETE CASCADE,
    CONSTRAINT fk_mimg_group FOREIGN KEY (modifier_group_id) REFERENCES modifier_groups (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE modifier_groups (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    branch_id BIGINT UNSIGNED NOT NULL,
    group_name VARCHAR(100) NOT NULL, -- e.g., 'Choose Crust'
    min_selections INT UNSIGNED NOT NULL DEFAULT 0, -- 1+ implies mandatory selection
    max_selections INT UNSIGNED NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_modifier_group_branch FOREIGN KEY (branch_id) REFERENCES restaurant_branches (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE modifiers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    modifier_group_id BIGINT UNSIGNED NOT NULL,
    option_name VARCHAR(100) NOT NULL, -- e.g., 'Thin Crust'
    extra_charge DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_modifier_group FOREIGN KEY (modifier_group_id) REFERENCES modifier_groups (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE orders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id_uuid VARCHAR(36) UNIQUE NOT NULL, -- Public tracking token
    customer_id BIGINT UNSIGNED NOT NULL,
    branch_id BIGINT UNSIGNED NOT NULL,
    delivery_address_id BIGINT UNSIGNED NOT NULL,
    order_type ENUM('asap', 'scheduled') NOT NULL DEFAULT 'asap',
    scheduled_slot_start TIMESTAMP NULL DEFAULT NULL,
    order_status ENUM('order_placed', 'restaurant_confirmed', 'preparing', 'ready_for_pickup', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled') NOT NULL DEFAULT 'order_placed',
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    applied_coupon_id BIGINT UNSIGNED NULL,
    special_instructions VARCHAR(150) NULL,
    estimated_delivery_time TIMESTAMP NULL DEFAULT NULL, -- Calculated ETA (CUST-FR-045)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_order_status (order_status),
    CONSTRAINT fk_order_customer FOREIGN KEY (customer_id) REFERENCES customers (user_id),
    CONSTRAINT fk_order_branch FOREIGN KEY (branch_id) REFERENCES restaurant_branches (id),
    CONSTRAINT fk_order_address FOREIGN KEY (delivery_address_id) REFERENCES customer_addresses (id),
    FOREIGN KEY (applied_coupon_id)
REFERENCES coupons(id),
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE order_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    menu_item_id BIGINT UNSIGNED NOT NULL,
    quantity TINYINT UNSIGNED NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    item_subtotal DECIMAL(10,2) NOT NULL,
    special_instructions VARCHAR(150) NULL,
    is_available_mid_order BOOLEAN NOT NULL DEFAULT TRUE, -- Handles real-time item drops (REST-FR-021)
    CONSTRAINT fk_oi_order FOREIGN KEY (order_id) REFERENCES orders (id),
    CONSTRAINT fk_oi_item FOREIGN KEY (menu_item_id) REFERENCES menu_items (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE order_item_modifiers (
    order_item_id BIGINT UNSIGNED NOT NULL,
    modifier_id BIGINT UNSIGNED NOT NULL,
    price_charged DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (order_item_id, modifier_id),
    CONSTRAINT fk_oim_line FOREIGN KEY (order_item_id) REFERENCES order_items (id) ON DELETE CASCADE,
    CONSTRAINT fk_oim_modifier FOREIGN KEY (modifier_id) REFERENCES modifiers (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE delivery_partners (
    user_id BIGINT UNSIGNED PRIMARY KEY,
    vehicle_type ENUM('bicycle', 'motorcycle', 'car') NOT NULL,
    vehicle_registration_number VARCHAR(50) NULL,
    government_id_url VARCHAR(255) NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    work_status ENUM('online', 'offline') NOT NULL DEFAULT 'offline',
    current_coordinates POINT NULL SRID 4326, 
    performance_rating DECIMAL(3,2) NOT NULL DEFAULT 5.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    SPATIAL INDEX idx_partner_location (current_coordinates),
    CONSTRAINT fk_driver_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE deliveries (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED UNIQUE NOT NULL,
    delivery_partner_id BIGINT UNSIGNED NULL,
    assignment_status ENUM('searching', 'assigned', 'accepted', 'declined', 'escalated') NOT NULL DEFAULT 'searching',
    failed_attempts_count TINYINT UNSIGNED NOT NULL DEFAULT 0, -- Evaluates the 3-attempt protocol (UC-03)
    pickup_confirmed_at TIMESTAMP NULL DEFAULT NULL,
    delivery_confirmed_at TIMESTAMP NULL DEFAULT NULL,
    delivery_proof_url VARCHAR(255) NULL, -- Image backup upload target (DEL-FR-011)
    base_payout DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    distance_bonus DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tips_collected DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_delivery_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_delivery_partner FOREIGN KEY (delivery_partner_id) REFERENCES delivery_partners (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE delivery_issue_reports (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    delivery_id BIGINT UNSIGNED NOT NULL,
    delivery_partner_id BIGINT UNSIGNED NOT NULL,
    issue_type ENUM('customer_unavailable', 'wrong_address', 'restaurant_delay', 'traffic_delay', 'accident_or_breakdown', 'customer_refused_order') NOT NULL,
    reporter_comments VARCHAR(500) NULL, -- Partner text inputs detailing the complication
    reported_at_coordinates POINT NOT NULL SRID 4326, -- Used to cross-reference with delivery destination (DEL-FR-012)
    proof_image_url VARCHAR(255) NULL, -- Optional photo uploaded via app (e.g., photo of a locked gate)
    resolution_status ENUM('pending', 'resolved_by_support', 'resolved_by_system', 'order_cancelled') NOT NULL DEFAULT 'pending',
    resolved_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    SPATIAL INDEX idx_issue_coordinates (reported_at_coordinates),
    INDEX idx_delivery_issue_lookup (delivery_id, issue_type),
    CONSTRAINT fk_issue_delivery FOREIGN KEY (delivery_id) REFERENCES deliveries (id) ON DELETE CASCADE,
    CONSTRAINT fk_issue_partner FOREIGN KEY (delivery_partner_id) REFERENCES delivery_partners (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE coupons (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    coupon_code VARCHAR(50) UNIQUE NOT NULL,
    coupon_type ENUM('percentage_discount', 'flat_amount_discount', 'free_delivery', 'bogo') NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,
    min_cart_value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    per_user_limit INT UNSIGNED NOT NULL DEFAULT 1,
    total_usage_cap INT UNSIGNED NULL DEFAULT NULL,
    total_used_counter INT UNSIGNED NOT NULL DEFAULT 0,
    valid_from TIMESTAMP NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE transactions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    gateway_transaction_id VARCHAR(100) UNIQUE NOT NULL, -- Razorpay / Stripe transaction ID
    payment_method ENUM('card', 'upi', 'net_banking', 'wallet', 'cod') NOT NULL,
    payment_gateway ENUM('razorpay', 'stripe') NULL,
    card_token VARCHAR(191) NULL, -- PCI-DSS Token reference; raw numbers are never stored (PAY-FR-002)
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    transaction_status ENUM('initiated', 'processing', 'success', 'failed', 'refunded') NOT NULL DEFAULT 'initiated',
    gateway_response_code VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Immutable log marker (PAY-FR-005)
    CONSTRAINT fk_tx_order FOREIGN KEY (order_id) REFERENCES orders (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE dispute_tickets (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ticket_number VARCHAR(36) UNIQUE NOT NULL, -- Publicly visible support ticket reference (UUID format)
    order_id BIGINT UNSIGNED NOT NULL,
    customer_id BIGINT UNSIGNED NOT NULL,
    assigned_admin_id BIGINT UNSIGNED NULL, -- Admin handling the workflow (CUST-FR-006 / ADMIN Role)
    category ENUM('missing_items', 'damaged_packaging', 'wrong_order', 'late_delivery', 'poor_food_quality', 'payment_issue') NOT NULL,
    priority ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
    status ENUM('open', 'under_investigation', 'resolved_refunded', 'resolved_rejected', 'escalated') NOT NULL DEFAULT 'open',
    resolution_summary VARCHAR(500) NULL, -- Official summary text logged by the administrator upon closing
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_dispute_status (status, priority),
    CONSTRAINT fk_dispute_order FOREIGN KEY (order_id) REFERENCES orders (id),
    CONSTRAINT fk_dispute_customer FOREIGN KEY (customer_id) REFERENCES customers (user_id),
    CONSTRAINT fk_dispute_admin FOREIGN KEY (assigned_admin_id) REFERENCES admin_profiles(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE dispute_messages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    dispute_ticket_id BIGINT UNSIGNED NOT NULL,
    sender_id BIGINT UNSIGNED NOT NULL, -- Maps to users.id (Can be customer or administrator)
    message_text TEXT NOT NULL,
    attachment_url VARCHAR(255) NULL, -- Optional photo evidence upload path
    is_internal_only BOOLEAN NOT NULL DEFAULT FALSE, -- Allows admins to leave internal investigation notes invisible to the customer
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_msg_ticket FOREIGN KEY (dispute_ticket_id) REFERENCES dispute_tickets (id) ON DELETE CASCADE,
    CONSTRAINT fk_msg_sender FOREIGN KEY (sender_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE refunds (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    dispute_ticket_id BIGINT UNSIGNED NOT NULL,
    transaction_id BIGINT UNSIGNED NOT NULL, -- Core transaction being reversed
    refund_reference_id VARCHAR(100) UNIQUE NULL, -- Return token generated by Razorpay/Stripe
    refund_amount DECIMAL(10,2) NOT NULL, -- Supports exact partial or full currency values
    reason_code ENUM('item_undelivered', 'spoiled_food', 'incorrect_charge', 'goodwill_gesture', 'merchant_unable_to_fulfill') NOT NULL,
    status ENUM('initiated', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'initiated',
    processed_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_refund_ticket FOREIGN KEY (dispute_ticket_id) REFERENCES dispute_tickets (id),
    CONSTRAINT fk_refund_tx FOREIGN KEY (transaction_id) REFERENCES transactions (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reviews (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED UNIQUE NOT NULL, -- Implicit validation checking (CUST-FR-064)
    customer_id BIGINT UNSIGNED NOT NULL,
    branch_id BIGINT UNSIGNED NOT NULL,
    rating_food TINYINT UNSIGNED NOT NULL CHECK (rating_food BETWEEN 1 AND 5),
    rating_delivery TINYINT UNSIGNED NOT NULL CHECK (rating_delivery BETWEEN 1 AND 5),
    rating_packaging TINYINT UNSIGNED NOT NULL CHECK (rating_packaging BETWEEN 1 AND 5),
    review_text VARCHAR(500) NULL,
    moderation_status ENUM('approved', 'flagged_pending', 'hidden') NOT NULL DEFAULT 'approved',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Tracked for 48-hour locks (BR-REV-02)
    CONSTRAINT fk_review_order FOREIGN KEY (order_id) REFERENCES orders (id),
    CONSTRAINT fk_review_customer FOREIGN KEY (customer_id) REFERENCES customers (user_id),
    CONSTRAINT fk_review_branch FOREIGN KEY (branch_id) REFERENCES restaurant_branches (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE review_photos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    review_id BIGINT UNSIGNED NOT NULL,
    photo_url VARCHAR(255) NOT NULL,
    CONSTRAINT fk_photo_review FOREIGN KEY (review_id) REFERENCES reviews (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE review_replies (
    review_id BIGINT UNSIGNED PRIMARY KEY,
    branch_id BIGINT UNSIGNED NOT NULL,
    reply_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reply_review FOREIGN KEY (review_id) REFERENCES reviews (id) ON DELETE CASCADE,
    CONSTRAINT fk_reply_branch FOREIGN KEY (branch_id) REFERENCES restaurant_branches (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE admin_audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    admin_user_id BIGINT UNSIGNED NOT NULL,
    action_type VARCHAR(100) NOT NULL, -- e.g., 'USER_DEACTIVATION', 'MENU_OVERRIDE'
    target_entity VARCHAR(100) NOT NULL, -- e.g., 'users', 'menu_items'
    target_id BIGINT UNSIGNED NOT NULL,
    changes_json JSON NULL, -- Contains old vs new schema deltas
    reason_text TEXT NOT NULL, -- Mandatory justification code block (ADMIN-FR-002)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_admin FOREIGN KEY (admin_user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS admin_audit_logs, review_replies, review_photos, reviews, refunds, transactions, coupons, deliveries, delivery_partners, order_item_modifiers, order_items, orders, modifiers, menu_item_modifier_groups, modifier_groups, menu_items, menu_categories, restaurant_operating_hours, restaurant_branches, restaurants, customer_addresses, customers, otp_verifications, auth_tokens, user_social_accounts, users;
SET FOREIGN_KEY_CHECKS = 1;

-- Paste individual table configuration definitions sequentially here...

