<?php

namespace lib\channel;

use Yii;
use odannyc\Yii2SSE\SSEBase;
use app\models\Message;
use app\models\Session;

class Channel extends SSEBase
{
  /** 
   * The name of the channel
   * @var string 
   */
  protected $name;

  /** 
   * The query for identifying messages 
   * @var \yii\db\ActiveQuery  
   */
  protected $query;

  /** 
   * The session object for identifying messages 
   * @var \app\models\Session
   */
  protected $session;  

  /**
   * Constructor
   *
   * @param string $name The name of the channel
   * @param string|null $sessionId The string id of the session. Defaults to
   * the Yii session id
   */
  public function __construct( $name, $sessionId = null ){
    // validate
    if( ! $name or ! is_string($name) ) {
      throw new \InvalidArgumentException("Channel name must be a string.");
    }
    if( ! $sessionId ) {
      $sessionId = Yii::$app->session->getId();
    }
    $session = Session::findOne(['namedId' => $sessionId] );
    if( ! $session ) {
      throw new \InvalidArgumentException("Session '$sessionId' does not exist.");
    }
    // set properties
    $this->name = $name;
    $this->session = $session;
    $this->query = Message::find()->where(['SessionId' => $session->id, 'name' => $name] );
  }

  /**
   * Returns true if new data is available
   *
   * @return bool
   */
  public function check()
  {
    return $this->query->exists();
  }

  /**
   * Returns the new data to be sent to the client
   *
   * @return string
   */
  public function update()
  {
    $data = [];
    $idsToDelete = [];
    foreach( $this->query->asArray()->all() as $record ) {
      $d = json_decode($record['data']);
      $data[] = is_object($d) ? (array) $d : $d;
      $idsToDelete[] = $record['id']; 
    }
    // delete retrieved messages
    Message::deleteAll(['in', 'id', $idsToDelete ]);
    return $data;
  }

  /**
   * Getter for channel name
   *
   * @return string
   */
  public function getName()
  {
    return $this->name;
  }

  /**
   * Broadcast data over this channel
   *
   * @param mixed $data The data to broadcast
   * @return void
   */
  public function broadcast( $data )
  {
    Message::broadcast($this,$data);
  }

  /**
   * Send a message to the connected client
   *
   * @param mixed $data
   * @return void
   */
  public function send( $data )
  {
    Message::send($this, $data, $this->session->namedId);
  }
}