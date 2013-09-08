#!/usr/bin/env bash

pid=$1
peak=0
while true; do
  sleep 1
  sample="$(ps -o rss= $pid)" || break
  echo $sample
  let peak='sample > peak ? sample : peak'
done
echo "Peak: $peak"

