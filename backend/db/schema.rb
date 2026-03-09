# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_03_09_215232) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "audits", force: :cascade do |t|
    t.string "action"
    t.integer "associated_id"
    t.string "associated_type"
    t.integer "auditable_id"
    t.string "auditable_type"
    t.text "audited_changes"
    t.string "comment"
    t.datetime "created_at"
    t.string "remote_address"
    t.string "request_uuid"
    t.integer "user_id"
    t.string "user_type"
    t.string "username"
    t.integer "version", default: 0
    t.index ["associated_type", "associated_id"], name: "associated_index"
    t.index ["auditable_type", "auditable_id", "version"], name: "auditable_index"
    t.index ["created_at"], name: "index_audits_on_created_at"
    t.index ["request_uuid"], name: "index_audits_on_request_uuid"
    t.index ["user_id", "user_type"], name: "user_index"
  end

  create_table "bets", force: :cascade do |t|
    t.string "bet_type", null: false
    t.datetime "created_at", null: false
    t.bigint "match_id", null: false
    t.decimal "points_earned", precision: 6, scale: 2, default: "0.0", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["match_id"], name: "index_bets_on_match_id"
    t.index ["user_id", "match_id"], name: "index_bets_on_user_id_and_match_id", unique: true
    t.index ["user_id"], name: "index_bets_on_user_id"
  end

  create_table "matches", force: :cascade do |t|
    t.integer "away_score"
    t.string "away_team", null: false
    t.datetime "created_at", null: false
    t.string "group_label"
    t.integer "home_score"
    t.string "home_team", null: false
    t.datetime "kickoff_time", null: false
    t.decimal "odds_away", precision: 4, scale: 2
    t.decimal "odds_draw", precision: 4, scale: 2
    t.decimal "odds_draw_away", precision: 4, scale: 2
    t.decimal "odds_home", precision: 4, scale: 2
    t.decimal "odds_home_away", precision: 4, scale: 2
    t.decimal "odds_home_draw", precision: 4, scale: 2
    t.datetime "updated_at", null: false
    t.index ["kickoff_time"], name: "index_matches_on_kickoff_time"
  end

  create_table "users", force: :cascade do |t|
    t.boolean "activated", default: false
    t.boolean "admin", default: false
    t.datetime "created_at", null: false
    t.string "invite_token"
    t.string "nickname", null: false
    t.string "password_digest"
    t.integer "previous_rank"
    t.datetime "updated_at", null: false
    t.index "lower((nickname)::text)", name: "index_users_on_lower_nickname", unique: true
    t.index ["nickname"], name: "index_users_on_nickname", unique: true
  end

  add_foreign_key "bets", "matches"
  add_foreign_key "bets", "users"
end
