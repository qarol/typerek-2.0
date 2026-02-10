class CreateBets < ActiveRecord::Migration[8.1]
  def change
    create_table :bets do |t|
      t.references :user, null: false, foreign_key: true
      t.references :match, null: false, foreign_key: true
      t.string :bet_type, null: false
      t.decimal :points_earned, precision: 6, scale: 2, default: 0.0, null: false

      t.timestamps
    end

    add_index :bets, [:user_id, :match_id], unique: true
  end
end
