<?php
/* ************************************************************************

   Bibliograph: Collaborative Online Reference Management

   http://www.bibliograph.org

   Copyright:
     2007-2017 Christian Boulanger

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Chritian Boulanger (cboulanger)

************************************************************************ */

namespace lib\dialog;
use Yii;

class Confirm extends Dialog
{
  /**
   * Returns an event to the client which prompts the user to confirm something
   * @param string $message 
   *    The message text
   * @param array|null|true $choices
   *    Array containing the "Yes" and the "No" message. A third optional
   *    parameter is a boolean which determines whether a cancel button is
   *    shown or not (default to false). If null, show a standard yes/no.
   *    If true, show yes/no/cancel.
   * @param string $callbackService 
   *    Service that will be called when the user clicks on the OK button
   * @param string $callbackMethod 
   *    Service method
   * @param array $callbackParams 
   *    Optional service params
   */
  public static function create(
    $message,
    $choices,
    $callbackService,
    $callbackMethod,
    $callbackParams=null )
  {
    if ( $choices === null )
    {
      $choices = array( Yii::t('app',"Yes"), Yii::t('app',"No"), false );
    }
    elseif ( $choices === true )
    {
      $choices = array( Yii::t('app',"Yes"), Yii::t('app',"No"), true );
    }
    static::addToEventQueue( array(
     'type' => "confirm",
     'properties'  => array(
        'message'        => $message,
        'yesButtonLabel' => $choices[0],
        'noButtonLabel'  => $choices[1],
        'allowCancel'    => isset( $choices[2] ) ? $choices[2] : false
      ),
     'service' => $callbackService,
     'method'  => $callbackMethod,
     'params'  => $callbackParams
    ));
  }
  
  /**
   * Static utility method to check whether the arguments passed to 
   * a method are the result of a qcl_ui_dialog_Confirm response.
   * This works only if the first argument of the method is not a 
   * boolean value. Returns false if the confirmation response was 
   * the equivalent of "no" and the method arguments as an array in
   * the other case, with an additional "true" value appended to indicate
   * that the confirmation was successful.
   * 
   * @param array $args
   * @return false|array
   */
  static public function getArguments( $args )
  {
  	if ( gettype( $args[0] ) == "boolean" ) {
  		if ( $args[0] === false ){
  			return false;	
  		}
  		array_shift( $args );
  		array_push( $args, true );
  	}
		return $args;
  }
}
