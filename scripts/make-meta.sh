#!/bin/bash

# Define constants
CHARSET_META_FILENAME=charset-meta.json
CHAR_META_FILENAME=char-meta.json

# Get the directory for all character sets
ROOT_DIR=$(dirname -- $(readlink -f $BASH_SOURCE))/..
CHARSET_DIR=$ROOT_DIR/public/character-sets

# Start creating the character set meta file
cd $CHARSET_DIR
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

  # Finish off the character meta file
  echo -n ']}' >> $CHAR_META_FILENAME
  cd ..

done

# Finish off the character set meta file
echo -n ']}' >> $CHARSET_META_FILENAME