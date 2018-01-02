<?php

use yii\db\Migration;

class m180102_104347_update_table_data_User extends Migration
{
  public function safeUp()
  {
    $this->addColumn('{{%data_User}}', 'token', $this->string(32));
    $this->createIndex('unique_token', '{{%data_User}}', 'token', true);
  }

  public function safeDown()
  {
    $this->dropIndex('unique_token', '{{%data_User}}');
    $this->dropColumn('{{%data_User}}', 'token');
  }
}
