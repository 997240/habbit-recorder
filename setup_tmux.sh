#!/bin/bash
SESSION="work"

tmux new-session -d -s $SESSION -n main-docker
tmux new-window -t $SESSION -n run
tmux new-window -t $SESSION -n log
tmux new-window -t $SESSION -n git
tmux new-window -t $SESSION -n monitor

tmux select-window -t $SESSION:0
tmux attach -t $SESSION