CREATE TABLE "gba_rom" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"file_name" text,
	"rom_data" "bytea",
	"cover_image_base64" text,
	"size" integer,
	"checksum" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gba_rom_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rom_id" uuid NOT NULL,
	"slot" integer DEFAULT 0 NOT NULL,
	"state_data" "bytea",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rom_states_rom_id_slot_unique" UNIQUE("rom_id","slot")
);
--> statement-breakpoint
CREATE TABLE "gba_setting" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"body_color" text DEFAULT '#9BBC0F' NOT NULL,
	"key_mapping" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"frame_rate" integer DEFAULT 60 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gba_rom_state" ADD CONSTRAINT "gba_rom_state_rom_id_gba_rom_id_fk" FOREIGN KEY ("rom_id") REFERENCES "public"."gba_rom"("id") ON DELETE cascade ON UPDATE no action;