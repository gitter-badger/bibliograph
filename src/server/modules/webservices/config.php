<?php

use app\modules\webservices\Module;
use yii\base\ModelEvent;
use yii\db\BaseActiveRecord;
use yii\web\User;
use yii\web\UserEvent;

/** @noinspection MissedFieldInspection */
return [
  'id' => 'webservices',
  'class' => Module::class,
  'events' => [
    [
      'class' => User::class,
      'event' => User::EVENT_AFTER_LOGOUT,
      'callback' => [Module::class, "on_after_logout"]
    ],
    [
      'class' => \app\models\User::class,
      'event' => BaseActiveRecord::EVENT_AFTER_DELETE,
      'callback' => [Module::class, "on_after_delete"]
    ]
  ]
];