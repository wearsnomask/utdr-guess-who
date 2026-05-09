#!/bin/bash

# Constants
CHARSET_META_FILENAME=charset-meta.json
CHAR_META_FILENAME=char-meta.json
CONFIG_FILENAME=config.json

# Get the directory for all character sets
ROOT_DIR=$(dirname -- $(readlink -f $BASH_SOURCE))/..

# If doing a Tauri build, we need to correct for a bug where Tauri doesn't support file/dir names with spaces in them,
# so we copy everything into a build directory and rename the files and directories there so there are no spaces
if [ ! -z $TAURI ]; then

  cd $ROOT_DIR
  rm -rf build
  mkdir build
  cp -r public build/

  CHARSET_DIR=$ROOT_DIR/build/public/character-sets
  cd $CHARSET_DIR

  for DIRNAME in *; do

    # Skip any files in this directory
    if [[ -f $DIRNAME || "$DIRNAME" == "build" ]]; then
      continue
    fi

    # Rename all directories, replacing spaces with %20
    PERCENT_ESCAPED_DIRNAME=$(echo -n $DIRNAME | sed -e 's/ /%20/g')
    if [[ ! $DIRNAME == $PERCENT_ESCAPED_DIRNAME ]]; then
      CMD="mv \"$DIRNAME\" \"$PERCENT_ESCAPED_DIRNAME\""
      eval $CMD
    fi

    # Now go into the directory and rename all image files
    cd "$PERCENT_ESCAPED_DIRNAME"

    for FILENAME in *.png; do

      PERCENT_ESCAPED_FILENAME=$(echo -n $FILENAME | sed -e 's/ /%20/g')

      if [[ ! $FILENAME == $PERCENT_ESCAPED_FILENAME ]]; then
        CMD="mv \"$FILENAME\" \"$PERCENT_ESCAPED_FILENAME\""
        eval $CMD
      fi

    done

    cd ..

  done

else # Non-Tauri build

  CHARSET_DIR=$ROOT_DIR/public/character-sets
  cd $CHARSET_DIR

fi

# Start creating the character set meta file
echo -n '{"sets":[' > $CHARSET_META_FILENAME

# Loop over character set folders. For each, add its entry to the character set meta file and make its character meta
# file
FIRST_DIR=true
for DIRNAME in *; do

  # Skip any files in this directory
  if [[ -f $DIRNAME ]]; then
    continue
  fi

  # For entries after the first, we add a comma to separate from the previous entry
  if [ $FIRST_DIR != true ]; then
    echo -n ',' >> $CHARSET_META_FILENAME
  else
    FIRST_DIR=false
  fi
  echo -n '"'$DIRNAME'"' >> $CHARSET_META_FILENAME

  # Create a character meta file for this folder
  cd "$DIRNAME"
  echo -n '{"chars":[' > $CHAR_META_FILENAME

  FIRST_FILE=true
  for FILENAME in *.png; do

    # For entries after the first, we add a comma to separate from the previous entry
    if [ $FIRST_FILE != true ]; then
      echo -n ',' >> $CHAR_META_FILENAME
    else
      FIRST_FILE=false
    fi
    echo -n '"'$FILENAME'"' >> $CHAR_META_FILENAME

  done

  # Finish off the character list
  echo -n ']' >> $CHAR_META_FILENAME

  # Check if a config file is present for this character set, and include the config if so
  if [[ -f $CONFIG_FILENAME ]]; then
    echo -n ',"config":' >> $CHAR_META_FILENAME
    cat $CONFIG_FILENAME >> $CHAR_META_FILENAME
  else
    echo -n ',"config":null' >> $CHAR_META_FILENAME
  fi

  # Finish off the file
  echo -n '}' >> $CHAR_META_FILENAME
  cd ..

done

# Finish off the character set meta file
echo -n ']}' >> $CHARSET_META_FILENAME