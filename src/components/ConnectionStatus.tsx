import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import { Wifi as ConnectedIcon, WifiOff as DisconnectedIcon } from '@mui/icons-material';

interface ConnectionStatusProps {
  isConnected: boolean;
  reconnecting: boolean;
}

export function ConnectionStatus({ isConnected, reconnecting }: ConnectionStatusProps) {
  if (reconnecting) {
    return (
      <Tooltip title="Reconnecting...">
        <Chip
          icon={<ConnectedIcon />}
          label="Reconnecting..."
          color="warning"
          size="small"
        />
      </Tooltip>
    );
  }
  
  return isConnected ? (
    <Tooltip title="Connected to game server">
      <Chip
        icon={<ConnectedIcon />}
        label="Connected"
        color="success"
        size="small"
      />
    </Tooltip>
  ) : (
    <Tooltip title="Disconnected from game server">
      <Chip
        icon={<DisconnectedIcon />}
        label="Disconnected"
        color="error"
        size="small"
      />
    </Tooltip>
  );
} 