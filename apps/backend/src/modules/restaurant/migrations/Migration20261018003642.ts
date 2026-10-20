import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261018003642 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "modifier_group" ("id" text not null, "name" text not null, "description" text null, "min_selection" integer not null default 0, "max_selection" integer not null default 1, "is_required" boolean not null default false, "product_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "modifier_group_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_modifier_group_deleted_at" ON "modifier_group" ("deleted_at") WHERE deleted_at IS NULL;`
    )

    this.addSql(
      `create table if not exists "modifier" ("id" text not null, "name" text not null, "price" numeric not null, "is_default" boolean not null default false, "max_quantity" integer null, "modifier_group_id" text not null, "raw_price" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "modifier_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_modifier_modifier_group_id" ON "modifier" ("modifier_group_id") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_modifier_deleted_at" ON "modifier" ("deleted_at") WHERE deleted_at IS NULL;`
    )

    this.addSql(
      `create table if not exists "restaurant_table" ("id" text not null, "name_or_number" text not null, "capacity" integer not null default 4, "status" text check ("status" in ('available', 'occupied', 'reserved', 'billing')) not null default 'available', "qr_code_token" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "restaurant_table_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_restaurant_table_deleted_at" ON "restaurant_table" ("deleted_at") WHERE deleted_at IS NULL;`
    )

    this.addSql(
      `create table if not exists "tab" ("id" text not null, "customer_name" text null, "status" text check ("status" in ('open', 'closed', 'cancelled')) not null default 'open', "restaurant_table_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "tab_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_tab_restaurant_table_id" ON "tab" ("restaurant_table_id") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_tab_deleted_at" ON "tab" ("deleted_at") WHERE deleted_at IS NULL;`
    )

    this.addSql(
      `alter table if exists "modifier" add constraint "modifier_modifier_group_id_foreign" foreign key ("modifier_group_id") references "modifier_group" ("id") on update cascade on delete cascade;`
    )

    this.addSql(
      `alter table if exists "tab" add constraint "tab_restaurant_table_id_foreign" foreign key ("restaurant_table_id") references "restaurant_table" ("id") on update cascade on delete cascade;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table if exists "modifier" drop constraint if exists "modifier_modifier_group_id_foreign";`
    )

    this.addSql(
      `alter table if exists "tab" drop constraint if exists "tab_restaurant_table_id_foreign";`
    )

    this.addSql(`drop table if exists "modifier_group" cascade;`)

    this.addSql(`drop table if exists "modifier" cascade;`)

    this.addSql(`drop table if exists "restaurant_table" cascade;`)

    this.addSql(`drop table if exists "tab" cascade;`)
  }
}
