import React from 'react';
import { FiMinus, FiMaximize2, FiX } from 'react-icons/fi';
import styled from 'styled-components';
import '../styles/TauriTitleBar.css';

const TitleBarContainer = styled.div`
  height: 32px;
  background: #121212;
  display: flex;
  justify-content: space-between;
  align-items: center;
  -webkit-app-region: drag;
  user-select: none;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  width: 100%;
`;

const AppTitle = styled.div`
  color: #b3b3b3;
  font-size: 14px;
  font-weight: 500;
  margin-left: 12px;
`;

const ControlsContainer = styled.div`
  display: flex;
  -webkit-app-region: no-drag;
`;

const ControlButton = styled.button`
  -webkit-app-region: no-drag;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 46px;
  height: 32px;
  background: transparent;
  border: none;
  color: #b3b3b3;
  outline: none;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;

  &:hover {
    background-color: ${props => props.isClose ? '#e81123' : '#2a2a2a'};
    color: ${props => props.isClose ? 'white' : '#e0e0e0'};
  }
`;

const TauriTitleBar = () => {
  const handleMinimize = async () => {
    try {
      // Direct Tauri API call
      if (window.__TAURI__) {
        await window.__TAURI__.window.appWindow.minimize();
      }
    } catch (error) {
      console.error('Failed to minimize window:', error);
    }
  };

  const handleMaximize = async () => {
    try {
      // Direct Tauri API call
      if (window.__TAURI__) {
        const isMaximized = await window.__TAURI__.window.appWindow.isMaximized();
        if (isMaximized) {
          await window.__TAURI__.window.appWindow.unmaximize();
        } else {
          await window.__TAURI__.window.appWindow.maximize();
        }
      }
    } catch (error) {
      console.error('Failed to maximize/restore window:', error);
    }
  };

  const handleClose = async () => {
    try {
      // Direct Tauri API call
      if (window.__TAURI__) {
        await window.__TAURI__.window.appWindow.close();
      }
    } catch (error) {
      console.error('Failed to close window:', error);
    }
  };

  return (
    <TitleBarContainer data-tauri-drag-region>
      <AppTitle>Spectrum Player</AppTitle>
      <ControlsContainer>
        <ControlButton onClick={handleMinimize}>
          <FiMinus size={16} />
        </ControlButton>
        <ControlButton onClick={handleMaximize}>
          <FiMaximize2 size={14} />
        </ControlButton>
        <ControlButton isClose onClick={handleClose}>
          <FiX size={18} />
        </ControlButton>
      </ControlsContainer>
    </TitleBarContainer>
  );
};

export default TauriTitleBar;
