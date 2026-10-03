#!/usr/bin/env python3
"""
Generates a standalone, high-resolution SVG diagram of the School ERP LLD
Entity-Relationship Model showing tables, columns, PKs/FKs, and relations.
"""

def generate_svg():
    width = 2400
    height = 1800

    # Domain color palettes
    colors = {
        "tenancy": {"header": "#0284c7", "bg": "#0f172a", "card": "#1e293b", "border": "#38bdf8"},
        "identity": {"header": "#9333ea", "bg": "#0f172a", "card": "#1e293b", "border": "#c084fc"},
        "academic": {"header": "#059669", "bg": "#0f172a", "card": "#1e293b", "border": "#34d399"},
        "student": {"header": "#d97706", "bg": "#0f172a", "card": "#1e293b", "border": "#fbbf24"},
        "fee": {"header": "#e11d48", "bg": "#0f172a", "card": "#1e293b", "border": "#fb7185"},
        "rbac": {"header": "#4f46e5", "bg": "#0f172a", "card": "#1e293b", "border": "#818cf8"},
        "comm": {"header": "#0891b2", "bg": "#0f172a", "card": "#1e293b", "border": "#22d3ee"},
    }

    # Table nodes: (name, domain, x, y, width, height, fields[(pk/fk/none, col, type)])
    tables = [
        # Tenancy
        ("school", "tenancy", 850, 100, 260, 200, [
            ("PK", "id", "UUID"),
            ("", "name", "VARCHAR"),
            ("", "address", "VARCHAR"),
            ("", "contact_email", "VARCHAR"),
            ("", "contact_phone", "VARCHAR"),
            ("FK", "current_subscription_id", "UUID"),
            ("", "status", "VARCHAR"),
        ]),
        ("plan", "tenancy", 1250, 100, 240, 200, [
            ("PK", "id", "UUID"),
            ("UK", "code", "VARCHAR"),
            ("", "display_name", "VARCHAR"),
            ("", "monthly_price", "DECIMAL(10,2)"),
            ("", "yearly_price", "DECIMAL(10,2)"),
            ("", "student_cap", "INT"),
            ("", "teacher_cap", "INT"),
        ]),
        ("school_subscription", "tenancy", 850, 360, 260, 210, [
            ("PK", "id", "UUID"),
            ("FK", "school_id", "UUID"),
            ("FK", "plan_id", "UUID"),
            ("", "billing_cycle", "VARCHAR"),
            ("", "start_date", "DATE"),
            ("", "end_date", "DATE"),
            ("", "status", "VARCHAR"),
            ("", "override_max_students", "INT"),
        ]),
        ("top_up_pack", "tenancy", 1250, 360, 240, 160, [
            ("PK", "id", "UUID"),
            ("FK", "school_id", "UUID"),
            ("", "channel", "SMS|WHATSAPP"),
            ("", "credits_purchased", "INT"),
            ("", "cost_paid", "DECIMAL(10,2)"),
        ]),
        
        # Identity
        ("admin", "identity", 450, 100, 240, 170, [
            ("PK", "id", "UUID"),
            ("FK", "school_id", "UUID"),
            ("", "name", "VARCHAR"),
            ("UK", "msisdn", "VARCHAR"),
            ("", "email", "VARCHAR"),
            ("", "password_hash", "VARCHAR"),
        ]),
        ("teacher", "identity", 450, 340, 260, 220, [
            ("PK", "id", "UUID"),
            ("FK", "school_id", "UUID"),
            ("UK", "employee_code", "VARCHAR"),
            ("UK", "login_msisdn", "VARCHAR"),
            ("", "name", "VARCHAR"),
            ("", "designation", "VARCHAR"),
            ("", "password_set", "BOOLEAN"),
        ]),
        ("parent_account", "identity", 450, 640, 250, 170, [
            ("PK", "id", "UUID"),
            ("FK", "school_id", "UUID"),
            ("UK", "msisdn", "VARCHAR"),
            ("", "name", "VARCHAR"),
            ("", "password_set", "BOOLEAN"),
        ]),
        ("auth_session", "identity", 100, 100, 240, 170, [
            ("PK", "id", "UUID"),
            ("", "actor_type", "VARCHAR"),
            ("", "actor_id", "UUID"),
            ("", "device_id", "VARCHAR"),
            ("", "token_hash", "VARCHAR"),
            ("", "active", "BOOLEAN"),
        ]),

        # Academic (Anchor Section)
        ("academic_year", "academic", 850, 680, 230, 150, [
            ("PK", "id", "UUID"),
            ("FK", "school_id", "UUID"),
            ("", "name", "VARCHAR"),
            ("", "status", "VARCHAR"),
        ]),
        ("grade", "academic", 1150, 680, 230, 150, [
            ("PK", "id", "UUID"),
            ("FK", "school_id", "UUID"),
            ("", "name", "VARCHAR"),
            ("", "sequence_order", "INT"),
        ]),
        ("section", "academic", 980, 920, 260, 210, [
            ("PK", "id", "UUID"),
            ("FK", "school_id", "UUID"),
            ("FK", "grade_id", "UUID"),
            ("FK", "academic_year_id", "UUID"),
            ("", "name", "VARCHAR"),
            ("FK", "class_teacher_id", "UUID"),
            ("", "capacity", "INT"),
        ]),
        ("department", "academic", 450, 920, 240, 160, [
            ("PK", "id", "UUID"),
            ("FK", "school_id", "UUID"),
            ("", "name", "VARCHAR"),
            ("UK", "code", "VARCHAR"),
            ("FK", "hod_teacher_id", "UUID"),
        ]),
        ("subject", "academic", 450, 1140, 240, 160, [
            ("PK", "id", "UUID"),
            ("FK", "school_id", "UUID"),
            ("", "name", "VARCHAR"),
            ("UK", "code", "VARCHAR"),
            ("FK", "department_id", "UUID"),
        ]),
        ("section_subject_map", "academic", 850, 1220, 240, 140, [
            ("PK", "id", "UUID"),
            ("FK", "section_id", "UUID"),
            ("FK", "subject_id", "UUID"),
        ]),
        ("section_subject_teacher", "academic", 1150, 1220, 250, 160, [
            ("PK", "id", "UUID"),
            ("FK", "section_id", "UUID"),
            ("FK", "subject_id", "UUID"),
            ("FK", "teacher_id", "UUID"),
        ]),

        # Student & Guardian
        ("student", "student", 1450, 680, 250, 210, [
            ("PK", "id", "UUID"),
            ("FK", "school_id", "UUID"),
            ("UK", "student_code", "VARCHAR"),
            ("", "name", "VARCHAR"),
            ("", "phone", "VARCHAR"),
            ("", "dob", "DATE"),
        ]),
        ("guardian", "student", 450, 1380, 250, 170, [
            ("PK", "id", "UUID"),
            ("FK", "parent_account_id", "UUID"),
            ("FK", "student_id", "UUID"),
            ("", "relation", "VARCHAR"),
            ("", "is_primary", "BOOLEAN"),
        ]),
        ("enrollment", "student", 1450, 980, 250, 180, [
            ("PK", "id", "UUID"),
            ("FK", "student_id", "UUID"),
            ("FK", "section_id", "UUID"),
            ("", "roll_no", "VARCHAR"),
            ("", "status", "ACTIVE|PROMOTED"),
        ]),

        # Fee Management
        ("fee_component", "fee", 1850, 680, 240, 150, [
            ("PK", "id", "UUID"),
            ("FK", "school_id", "UUID"),
            ("", "name", "VARCHAR"),
            ("UK", "code", "VARCHAR"),
        ]),
        ("section_fee_structure", "fee", 1850, 920, 260, 180, [
            ("PK", "id", "UUID"),
            ("FK", "section_id", "UUID"),
            ("FK", "fee_component_id", "UUID"),
            ("", "amount", "DECIMAL(10,2)"),
            ("", "frequency", "MONTHLY|ANNUAL"),
        ]),
        ("fee_invoice", "fee", 1850, 1180, 260, 230, [
            ("PK", "id", "UUID"),
            ("FK", "student_id", "UUID"),
            ("FK", "enrollment_id", "UUID"),
            ("UK", "year_month", "VARCHAR"),
            ("", "total_amount", "DECIMAL(10,2)"),
            ("", "balance", "DECIMAL(10,2)"),
            ("", "status", "PENDING|PAID"),
        ]),
        ("fee_invoice_line", "fee", 1850, 1480, 240, 150, [
            ("PK", "id", "UUID"),
            ("FK", "invoice_id", "UUID"),
            ("FK", "fee_component_id", "UUID"),
            ("", "amount", "DECIMAL(10,2)"),
        ]),
        ("payment", "fee", 1450, 1260, 250, 200, [
            ("PK", "id", "UUID"),
            ("FK", "student_id", "UUID"),
            ("", "amount", "DECIMAL(10,2)"),
            ("", "mode", "UPI|CARD|CASH"),
            ("UK", "gateway_txn_id", "VARCHAR"),
            ("", "status", "SUCCESS|PENDING"),
        ]),
        ("payment_allocation", "fee", 1450, 1530, 240, 160, [
            ("PK", "id", "UUID"),
            ("FK", "payment_id", "UUID"),
            ("FK", "invoice_id", "UUID"),
            ("", "allocated_amount", "DECIMAL(10,2)"),
        ]),
        ("refund", "fee", 1150, 1530, 240, 160, [
            ("PK", "id", "UUID"),
            ("FK", "payment_id", "UUID"),
            ("", "amount", "DECIMAL(10,2)"),
            ("", "mode", "CREDIT|CASH"),
            ("", "reason", "VARCHAR"),
        ]),

        # RBAC
        ("role", "rbac", 100, 360, 240, 170, [
            ("PK", "id", "UUID"),
            ("FK", "school_id", "UUID"),
            ("", "name", "VARCHAR"),
            ("", "system_role", "BOOLEAN"),
            ("", "description", "VARCHAR"),
        ]),
        ("permission", "rbac", 100, 600, 240, 160, [
            ("PK", "id", "UUID"),
            ("UK", "code", "VARCHAR"),
            ("", "module", "VARCHAR"),
            ("", "description", "VARCHAR"),
        ]),
        ("role_permission", "rbac", 100, 820, 240, 140, [
            ("PK,FK", "role_id", "UUID"),
            ("PK,FK", "permission_id", "UUID"),
        ]),
        ("actor_role_assignment", "rbac", 100, 1020, 250, 170, [
            ("PK", "id", "UUID"),
            ("", "actor_type", "VARCHAR"),
            ("", "actor_id", "UUID (Polymorphic)"),
            ("FK", "role_id", "UUID"),
        ]),
    ]

    # Connections: (from_table, to_table, label)
    connections = [
        ("school", "admin", "1 : N"),
        ("school", "teacher", "1 : N"),
        ("school", "parent_account", "1 : N"),
        ("school", "school_subscription", "1 : N"),
        ("plan", "school_subscription", "1 : N"),
        ("school", "top_up_pack", "1 : N"),
        ("school", "academic_year", "1 : N"),
        ("school", "grade", "1 : N"),
        ("school", "department", "1 : N"),
        ("school", "subject", "1 : N"),
        ("school", "student", "1 : N"),
        ("school", "fee_component", "1 : N"),
        ("school", "role", "1 : N"),
        ("grade", "section", "1 : N"),
        ("academic_year", "section", "1 : N"),
        ("teacher", "section", "class teacher (1 : 1)"),
        ("section", "enrollment", "1 : N"),
        ("student", "enrollment", "1 : N (1 ACTIVE)"),
        ("parent_account", "guardian", "1 : N"),
        ("student", "guardian", "1 : N"),
        ("section", "section_fee_structure", "1 : N"),
        ("fee_component", "section_fee_structure", "1 : N"),
        ("student", "fee_invoice", "1 : N"),
        ("enrollment", "fee_invoice", "1 : N"),
        ("fee_invoice", "fee_invoice_line", "1 : N"),
        ("fee_component", "fee_invoice_line", "1 : N"),
        ("student", "payment", "1 : N"),
        ("payment", "payment_allocation", "1 : N"),
        ("fee_invoice", "payment_allocation", "1 : N"),
        ("payment", "refund", "1 : N"),
        ("role", "role_permission", "1 : N"),
        ("permission", "role_permission", "1 : N"),
        ("role", "actor_role_assignment", "1 : N"),
        ("section", "section_subject_map", "1 : N"),
        ("subject", "section_subject_map", "1 : N"),
        ("section", "section_subject_teacher", "1 : N"),
        ("teacher", "section_subject_teacher", "1 : N"),
        ("department", "subject", "1 : N"),
        ("teacher", "department", "HOD"),
    ]

    t_map = {t[0]: (t[2], t[3], t[4], t[5], t[1]) for t in tables}

    svg = []
    svg.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}">')
    svg.append('<defs>')
    svg.append('''
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;family=JetBrains+Mono:wght@400;500&amp;display=swap');
            text { font-family: 'Inter', sans-serif; }
            .title { font-size: 28px; font-weight: 700; fill: #f8fafc; }
            .subtitle { font-size: 14px; font-weight: 400; fill: #94a3b8; }
            .tbl-title { font-size: 13px; font-weight: 700; fill: #ffffff; text-transform: uppercase; letter-spacing: 0.05em; }
            .col-name { font-size: 11px; font-weight: 500; fill: #e2e8f0; font-family: 'JetBrains Mono', monospace; }
            .col-type { font-size: 10px; font-weight: 400; fill: #64748b; font-family: 'JetBrains Mono', monospace; }
            .badge-pk { font-size: 9px; font-weight: 700; fill: #fbbf24; }
            .badge-fk { font-size: 9px; font-weight: 700; fill: #38bdf8; }
            .badge-uk { font-size: 9px; font-weight: 700; fill: #34d399; }
            .rel-line { stroke: #334155; stroke-width: 1.5; fill: none; opacity: 0.65; }
            .rel-line:hover { stroke: #38bdf8; stroke-width: 2.5; opacity: 1; }
        </style>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#090d16" />
            <stop offset="50%" stop-color="#0f172a" />
            <stop offset="100%" stop-color="#090d16" />
        </linearGradient>
        <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.45"/>
        </filter>
        <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 8 5 L 0 9 z" fill="#64748b" />
        </marker>
    ''')
    svg.append('</defs>')

    # Background
    svg.append(f'<rect width="{width}" height="{height}" fill="url(#bgGradient)" />')

    # Grid Pattern
    svg.append('<g opacity="0.04">')
    for x in range(0, width, 40):
        svg.append(f'<line x1="{x}" y1="0" x2="{x}" y2="{height}" stroke="#ffffff" stroke-width="1"/>')
    for y in range(0, height, 40):
        svg.append(f'<line x1="0" y1="{y}" x2="{width}" y2="{y}" stroke="#ffffff" stroke-width="1"/>')
    svg.append('</g>')

    # Header
    svg.append('<g transform="translate(60, 50)">')
    svg.append('<text class="title" x="0" y="0">School ERP — Low Level Design (LLD) ER Diagram</text>')
    svg.append('<text class="subtitle" x="0" y="24">Complete Database Schema, Table Specifications, Multi-Tenant Hierarchy &amp; Foreign Key Relationships</text>')
    svg.append('</g>')

    # Connections (Drawn behind cards)
    svg.append('<g id="relations">')
    for src, dst, lbl in connections:
        if src in t_map and dst in t_map:
            sx, sy, sw, sh, _ = t_map[src]
            dx, dy, dw, dh, _ = t_map[dst]
            
            # Simple midpoint line calculation
            start_x = sx + sw / 2
            start_y = sy + sh / 2
            end_x = dx + dw / 2
            end_y = dy + dh / 2

            # Smooth Bezier curve
            cx = (start_x + end_x) / 2
            cy = (start_y + end_y) / 2

            svg.append(f'<path d="M {start_x} {start_y} Q {cx} {cy} {end_x} {end_y}" class="rel-line" marker-end="url(#arrow)" />')
    svg.append('</g>')

    # Table Cards
    for name, domain, x, y, w, h, fields in tables:
        c = colors.get(domain, colors["tenancy"])
        svg.append(f'<g transform="translate({x}, {y})" filter="url(#cardShadow)">')
        
        # Card Body Background
        svg.append(f'<rect width="{w}" height="{h}" rx="10" fill="{c["card"]}" stroke="{c["border"]}" stroke-width="1.2" />')
        
        # Header Box
        svg.append(f'<path d="M 0 10 A 10 10 0 0 1 10 0 L {w-10} 0 A 10 10 0 0 1 {w} 10 L {w} 32 L 0 32 Z" fill="{c["header"]}" />')
        svg.append(f'<text class="tbl-title" x="14" y="21">{name}</text>')
        svg.append(f'<text class="col-type" x="{w-14}" y="20" text-anchor="end" fill="#ffffff" opacity="0.8">{domain}</text>')

        # Fields List
        line_y = 52
        for key_type, col, col_type in fields:
            # Key badge
            if key_type == "PK":
                svg.append(f'<text class="badge-pk" x="14" y="{line_y}">PK</text>')
            elif "FK" in key_type:
                svg.append(f'<text class="badge-fk" x="14" y="{line_y}">{key_type}</text>')
            elif key_type == "UK":
                svg.append(f'<text class="badge-uk" x="14" y="{line_y}">UK</text>')

            # Column Name
            svg.append(f'<text class="col-name" x="42" y="{line_y}">{col}</text>')
            # Column Type
            svg.append(f'<text class="col-type" x="{w-14}" y="{line_y}" text-anchor="end">{col_type}</text>')
            line_y += 20

        svg.append('</g>')

    # Legend
    svg.append('<g transform="translate(60, 1680)">')
    svg.append('<rect width="800" height="70" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1" />')
    svg.append('<text font-size="12" font-weight="600" fill="#f8fafc" x="20" y="25">LEGEND:</text>')
    svg.append('<text font-size="11" fill="#94a3b8" x="20" y="50">PK: Primary Key | FK: Foreign Key | UK: Unique Key | Tenant Isolation: All school-level tables carry school_id</text>')
    svg.append('</g>')

    svg.append('</svg>')
    return '\n'.join(svg)

if __name__ == '__main__':
    svg_content = generate_svg()
    with open('school-erp-lld-diagram.svg', 'w', encoding='utf-8') as f:
        f.write(svg_content)
    print("Successfully generated school-erp-lld-diagram.svg")
