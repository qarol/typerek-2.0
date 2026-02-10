class CreateMatches < ActiveRecord::Migration[8.1]
  def change
    create_table :matches do |t|
      t.string :home_team, null: false
      t.string :away_team, null: false
      t.datetime :kickoff_time, null: false
      t.string :group_label
      t.integer :home_score
      t.integer :away_score
      t.decimal :odds_home, precision: 4, scale: 2
      t.decimal :odds_draw, precision: 4, scale: 2
      t.decimal :odds_away, precision: 4, scale: 2
      t.decimal :odds_home_draw, precision: 4, scale: 2
      t.decimal :odds_draw_away, precision: 4, scale: 2
      t.decimal :odds_home_away, precision: 4, scale: 2
      t.timestamps
    end
  end
end
