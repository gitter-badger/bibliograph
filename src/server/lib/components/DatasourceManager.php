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

namespace lib\components;

use app\controllers\SetupController;
use app\models\BibliographicDatasource;
use app\models\Datasource;
use app\models\Schema;
use fourteenmeister\helpers\Dsn;
use lib\components\ConsoleAppHelper as Console;
use lib\exceptions\RecordExistsException;
use lib\exceptions\UserErrorException;
use Sse\Data;
use Yii;
use yii\db\Exception;
use yii\db\StaleObjectException;

/**
 * Component class providing methods to create and migrate datasource tables,
 * i.e. model tables that have a common prefix and are meant to be used together to
 * form a complex source of data
 * values
 */
class DatasourceManager extends \yii\base\Component
{

  /**
   * Creates a new datasource.
   *
   * @param string $datasourceName
   *    The name of the new datasource
   * @param string $schemaName |null
   *    Optional name of a schema. If not given, the default schema is used.
   * @return Datasource
   *    The instance for the given schema sub-class, not the \app\models\Datasource instance created.
   * @throws \Exception
   * @throws RecordExistsException
   */
  public function create( $datasourceName, $schemaName = null)
  {
    if (!$datasourceName or !is_string($datasourceName)) {
      throw new \InvalidArgumentException("Invalid datasource name");
    }

    if( ! $schemaName ){
      $schemaName = Yii::$app->config->getPreference('app.datasource.baseschema' );
    }

    $schema = Schema::findByNamedId($schemaName);
    if( ! $schema ){
      throw new \InvalidArgumentException("Schema '$schemaName' does not exist.");
    }

    $class = $schema->class;
    if (!is_subclass_of($class, Datasource::class)) {
      throw new \InvalidArgumentException("Invalid schema class '$class'. Must be subclass of " . Datasource::class);
    }

    if (Datasource::findByNamedId($datasourceName)) {
      throw new RecordExistsException("Datasource exists");
    }
    /** @noinspection MissedFieldInspection */
    $datasource = new Datasource([
      'namedId' => $datasourceName,
      'title'   => $datasourceName,
      'schema'  => $schemaName,
      'prefix'  => $class::createTablePrefix($datasourceName),
      'active'  => 1,
      'readonly' => 0,
      'hidden'  => 0
    ]);
    $dsnAttributes = $this->parseDsn();
    $datasource->setAttributes($dsnAttributes);
    $datasource->save();
    Yii::info("Created datasource '$datasourceName'.");
    //Yii::debug($datasource->getAttributes());

    // get the subclass instance and configure it
    $instance = Datasource::getInstanceFor($datasourceName);
    $this->createModelTables($instance);

    // @todo work with interface instead
    if ($instance instanceof BibliographicDatasource) {
      $instance->addDefaultFolders();
      try{
        Yii::$app->config->createKey("datasource.$datasourceName.fields.exclude","list");
      } catch( RecordExistsException $e ){
        Yii::warning($e->getMessage());
      }
    }
    return $instance;
  }

  /**
   * Parses a DSN string in a way that can be stored in the datasource db record.
   * If no DSN string is passed, the app default dsn is used.
   * @param string|null $dsn
   * @throws \Exception
   * @return array
   */
  public function parseDsn($dsn = null)
  {
    $dsn = ($dsn ? $dsn : Yii::$app->db->dsn);
    $dsn = Dsn::parse($dsn);
    $db = Yii::$app->db;
    return [
      'type' => $dsn->sheme,
      'host' => $dsn->host,
      'port' => $dsn->port,
      'database' => $dsn->database,
      'username' => $db->username,
      'password' => $db->password,
      'encoding' => $db->charset,
    ];
  }

  /**
   * Creates the tables necessary for a datasource, using migration files
   *
   * @param Datasource $datasource
   * @return void
   * @throws \Exception if console action fails
   */
  public function createModelTables(Datasource $datasource )
  {
    $migrationNamespace = $datasource->migrationNamespace;
    $params = [
      'all',
      'migrationNamespaces' => $migrationNamespace,
    ];

    $db = $datasource->getConnection();
    Yii::info("Creating model tables for '{$datasource->namedId}'");
    Yii::debug([
      "migrationNamespace" => $migrationNamespace,
      "dsn" => $db->dsn
    ]);
    Console::runAction('migrate/up', $params, null, $db);
    Yii::info("Created model tables for {$datasource->namedId}.");
  }

  /**
   * Deletes a datasource record and optionally all connected data
   * @param string $namedId
   * @param bool $deleteData
   *    Whether all connected models and their data should be deleted, too.
   * @throws \Exception
   */
  public function delete($namedId, $deleteData = false)
  {
    /** @var Datasource $datasource */
    $datasource = Datasource::getInstanceFor($namedId);
    $migrationNamespace = $datasource->migrationNamespace;
    try {
      $datasource->delete();
    } catch (\Throwable $e) {
      throw new \Exception($e->getMessage(),$e->getCode(),$e);
    }
    if ($deleteData) {
      if ($datasource instanceof BibliographicDatasource) {
        try {
          Yii::$app->config->deleteKey("datasource.$namedId.fields.exclude");
        } catch (\Throwable $e) {
          Yii::error($e->getMessage());
        }
      }
      Yii::debug("Deleting model tables for '$namedId', migration namespace '$migrationNamespace'...");
      $db = $datasource->getConnection();
      $params = [
        'all',
        'migrationNamespaces' => $migrationNamespace,
      ];
      Console::runAction('migrate/down', $params, null, $db);
      Yii::info("Deleted model tables for '$namedId''.");
    }
  }

  /**
   * Checks if new migrations exist for the tables of the given datasource
   *
   * @param Datasource $datasource
   * @return bool True if new migrations, false if up-to-date
   * @throws MigrationException
   * @throws \Exception
   */
  public function checkNewMigrations(Datasource $datasource)
  {
    $params = [
      'all',
      'migrationNamespaces' => $datasource->migrationNamespace,
    ];
    $db = $datasource->getConnection();
    $output = Console::runAction('migrate/new', $params, null, $db);
    return ! $output->contains("up-to-date");
  }

  /**
   * Migrates the tables of the datasources which are of the
   * given schema class to the newest version
   *
   * @param Schema $schema
   * @return int number of datasources that were migrated
   * @throws MigrationException
   * @throws UserErrorException
   * @throws \Exception
   */
  public function migrate(Schema $schema)
  {
    if (YII_ENV_PROD) {
      throw new UserErrorException(Yii::t('app', 'Datasource migrations are not allowed in production mode. Please contact the adminstrator'));
    };
    Yii::info("Migrating schema '{$schema->namedId}'...");
    $datasources = $schema->datasources;
    $count = 0;
    /** @var \app\models\Datasource $datasource */
    foreach ($datasources as $datasource) {
      $instance = Datasource::getInstanceFor($datasource->namedId);
      $migrationNamespace = $instance->migrationNamespace;
      Yii::info("Migrating datasource '{$instance->namedId}'...");
      Yii::debug( "Migration namespace: $migrationNamespace");
      $params = [ 'all', 'migrationNamespaces' => $migrationNamespace ];
      /** @var \yii\db\Connection $db */
      $db = $instance->getConnection();
      $output = Console::runAction('migrate/up', $params, null, $db);
      if( ! $output->contains("up-to-date")) $count++;
    }
    return $count;
  }
}