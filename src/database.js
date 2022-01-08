
class Database {

  static openDatabase( dbLocation ) {

    const dbName = dbLocation.split("/").slice(-1)[0]; // Get the DB file basename
    const source = this;

    if ( ! ( 'sqlitePlugin' in self )) {

      console.error( "cordova-sqlite-ext plugin not available" );

      return Promise.reject( 
        new Error( "cordova-sqlite-ext plugin not available. " +
          "Please install the plugin and make sure this code is run after onDeviceReady event"
      ));
 
    }

    if ( ! ( 'device' in self )) {

      console.error( "cordova-plugin-device plugin not available" );

      return Promise.reject( 
        new Error("cordova-plugin-device not available. " +
          "Please install the plugin and make sure this code is run after onDeviceReady event"
      ));
    }

    console.log( "Database.openDatabase(): top with location : " + dbLocation );

    return new Promise( function( resolve, reject ) {

      if ( device.platform === 'Android' ) {

        // source.listDirectories( cordova.file.applicationDirectory );

        resolveLocalFileSystemURL( cordova.file.applicationStorageDirectory, function ( dir ) {

          dir.getDirectory( 'databases', { create: true }, function ( subdir ) {

            console.log( "Database.openDatabase(): Resolving subdir: " + subdir.nativeURL );

            resolve( subdir );

          });

        }, reject );

      } else if ( device.platform === 'iOS' ) {

        resolveLocalFileSystemURL( cordova.file.documentsDirectory, resolve, reject );

      } else {

        console.error( "Platform not supported" );
        reject( "Platform not supported" );

      }

    }).then( function( targetDir ) {

      console.log( "Database.openDatabase(): Then targetDir: " + targetDir.nativeURL );

      source.listDirectories( cordova.file.applicationStorageDirectory );

      // has the database file already been copied? 

      return new Promise( function (resolve, reject) {

        targetDir.getFile( dbName, {}, resolve, reject );

      }).catch( function () {

        console.log( "Database.openDatabase(): calling copyDatabaseFile: " + dbLocation + " " + dbName + " " + targetDir.nativeURL );

        return source.copyDatabaseFile( dbLocation, dbName, targetDir )

      });

    }).then( function () {

      // now that the database is in the correct location (either because it was just copied or
      // copied during a previous run, open it.

      var params = {name: dbName};

      if ( device.platform === 'iOS' ) {
        params.iosDatabaseLocation = 'Documents';
      } else {
        params.location = 'default';
      }

      console.log( "Database.openDatabase(): calling sqlitePlugin.openDatabase with params: ", params );

      var db = sqlitePlugin.openDatabase( params );
   
      if ( ! db ) {
        console.error( "Database.openDatabase(): unable to open tiles database." );
      }

      return db;

    }).catch( function( error ) {

      console.error( "Database.openDatabase(): Failed opening database '" + dbName + "':", error );

      return Promise.reject( new Error( "Failed opening database '" + dbName + "':" + error ));

    });

  } // end of openDatabase()

  // -------------------------------------------------------------------------------

  /**
  * copy Database to working directory
  *
  * @return {Promise}
  */

  static copyDatabaseFile( dbLocation, dbName, targetDir ) {

    console.log("Copying database to application storage directory");

    return new Promise( function( resolve, reject ) {

      console.log( "resolving local file system url");

      const absPath =  cordova.file.applicationDirectory + 'public/' + dbLocation;
                                                          
      console.log( "Database.copyDatabaseFile(): absPath is '" + absPath + "'" );

      resolveLocalFileSystemURL( absPath, resolve, reject );

    }).then( function ( sourceFile ) {

      console.log( "Database.copyDatabaseFile(): sourceFile is '" + sourceFile + "'" );

      return new Promise( function( resolve, reject ) {

        console.log( "Database.copyDatabaseFile(): calling copyTo(): " + targetDir );

        sourceFile.copyTo( targetDir, dbName, resolve, reject );

      }).then(function () {

        console.log("Database copied");

      }).catch( function( error ) {

         console.error( "Database.copyDatabaseFile(): Unable to copy database:", error );

         reject( "Unable to copy database : " + error );

      });

    });
  }

    // ------------------------------------------------------------------------

    /**
    * list out the contents of a given device directory to the console.
    *
    * @param {string} url
    *
    * @link https://stackoverflow.com/questions/35192695/phonegap-cordova-for-android-file-plugin-error-code-1
    */

    static listDirectories( url ) {

      var dirEntry = function (entry) {
        var dirReader = entry.createReader();
        dirReader.readEntries(
          function (entries) {
            for ( let subEntry of entries ) {

              if ( subEntry.isDirectory === true) {

                console.log( "Directory : " + subEntry.nativeURL );

                // Recursive -- call back into this subdirectory

                dirEntry( subEntry );
              } else {
                console.log( "File : " + subEntry.nativeURL );
              }

            }
          },
          function (error) {
            console.log( "readEntries error: " + error.code );
          }
        );
      };

      var dirError = function (error) {
        console.log("getDirectory error: " + error.code);
      };

      window.resolveLocalFileSystemURL( url, dirEntry, dirError );

    }

}

export default Database
