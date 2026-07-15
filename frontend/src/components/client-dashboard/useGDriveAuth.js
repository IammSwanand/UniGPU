/**
 * useGDriveAuth — Google Drive OAuth Authorization Code flow hook.
 *
 * Flow:
 *  1. User clicks "Connect Google Drive"
 *  2. Hook opens a popup window pointing to Google's OAuth consent screen
 *     (Authorization Code flow with access_type=offline, prompt=consent)
 *  3. Google redirects to /oauth/gdrive/callback with ?code=...
 *  4. The callback page posts { authCode } back via window.postMessage
 *  5. User then selects a CSV file using the Google Picker API
 *  6. Hook returns { authCode, fileId, fileName, isConnected, connect, disconnect }
 *
 * The auth code is sent to the backend at job submission time.
 * The backend exchanges it for a refresh token — the frontend never touches tokens.
 *
 * Requirements:
 *  - VITE_GOOGLE_CLIENT_ID env var must be set (frontend only needs client ID, not secret)
 *  - /oauth/gdrive/callback route must exist and post message (see public/oauth/gdrive/callback.html)
 *  - Google Picker API loaded via script tag (loaded lazily here)
 */

import { useState, useCallback, useRef } from 'react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';
const REDIRECT_URI = `${window.location.origin}/oauth/gdrive/callback`;

export function useGDriveAuth() {
  const [state, setState] = useState(null); // { authCode, fileId, fileName, redirectUri }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const popupRef = useRef(null);
  const listenerRef = useRef(null);

  const disconnect = useCallback(() => {
    setState(null);
    setError(null);
  }, []);

  /**
   * Step 1: Open Google OAuth popup.
   * On success, sets authCode in state and opens the file picker.
   */
  const connect = useCallback(async () => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Google Drive is not configured. Contact support.');
      return;
    }

    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: SCOPES,
      access_type: 'offline',
      prompt: 'consent',   // Ensures refresh_token is always returned
    });

    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    const popup = window.open(oauthUrl, 'gdrive-oauth', 'width=500,height=620,scrollbars=yes');
    popupRef.current = popup;

    // Listen for postMessage from the callback page
    const messageHandler = async (event) => {
      if (event.origin !== window.location.origin) return;
      if (!event.data?.gdrive_auth_code) return;

      // Clean up listener
      window.removeEventListener('message', messageHandler);
      listenerRef.current = null;
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }

      const authCode = event.data.gdrive_auth_code;

      // Step 2: Open Google Picker to let user select a CSV file
      try {
        const pickerResult = await _openGDrivePicker(authCode);
        if (pickerResult) {
          setState({
            authCode,
            fileId: pickerResult.id,
            fileName: pickerResult.name,
            redirectUri: REDIRECT_URI,
          });
        }
      } catch (err) {
        setError('Failed to open Google Drive file picker. Please try again.');
        console.error('[GDriveAuth] Picker error:', err);
      } finally {
        setLoading(false);
      }
    };

    window.addEventListener('message', messageHandler);
    listenerRef.current = messageHandler;

    // Detect if popup was closed without completing auth
    const pollClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(pollClosed);
        if (listenerRef.current) {
          window.removeEventListener('message', listenerRef.current);
          listenerRef.current = null;
          setLoading(false);
        }
      }
    }, 500);
  }, []);

  return {
    /** Drive state: { authCode, fileId, fileName, redirectUri } | null */
    gdriveState: state,
    isConnected: !!state,
    loading,
    error,
    connect,
    disconnect,
  };
}

/**
 * Opens the Google Picker API to let the user select a CSV file.
 * Returns { id, name } of the selected file, or null if cancelled.
 *
 * Note: The Picker API requires an access token (short-lived), not the auth code.
 * We request one from Google's token endpoint using the auth code for a once-off
 * access token to display the picker. The backend independently exchanges the
 * auth code for a refresh token on submit.
 *
 * IMPORTANT: The auth code is single-use. To avoid consuming it, we use a
 * separate "picker-only" implicit token request (response_type=token) for the
 * picker display, while keeping the auth code for the backend exchange.
 */
async function _openGDrivePicker(authCode) {
  // Load the Picker API script if not already loaded
  await _loadPickerApi();

  return new Promise((resolve) => {
    // We need an access token just for the picker.
    // Use implicit grant (separate request) so the auth code remains intact for backend.
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'token',
      scope: SCOPES,
    });

    const tokenPopup = window.open(
      `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
      'gdrive-picker-token',
      'width=500,height=620',
    );

    const tokenListener = (event) => {
      if (event.origin !== window.location.origin) return;
      if (!event.data?.gdrive_access_token) return;

      window.removeEventListener('message', tokenListener);
      if (tokenPopup && !tokenPopup.closed) tokenPopup.close();

      const accessToken = event.data.gdrive_access_token;
      _showPicker(accessToken, resolve);
    };

    window.addEventListener('message', tokenListener);

    // If user closes without granting
    const poll = setInterval(() => {
      if (tokenPopup?.closed) {
        clearInterval(poll);
        window.removeEventListener('message', tokenListener);
        resolve(null);
      }
    }, 500);
  });
}

function _showPicker(accessToken, resolve) {
  const view = new window.google.picker.DocsView()
    .setMimeTypes('text/csv,application/vnd.ms-excel')
    .setSelectFolderEnabled(false);

  const picker = new window.google.picker.PickerBuilder()
    .addView(view)
    .setOAuthToken(accessToken)
    .setCallback((data) => {
      if (data.action === window.google.picker.Action.PICKED) {
        const doc = data.docs[0];
        resolve({ id: doc.id, name: doc.name });
      } else if (data.action === window.google.picker.Action.CANCEL) {
        resolve(null);
      }
    })
    .build();

  picker.setVisible(true);
}

function _loadPickerApi() {
  return new Promise((resolve, reject) => {
    if (window.google?.picker) {
      resolve();
      return;
    }
    const existing = document.getElementById('google-picker-api');
    if (existing) {
      existing.onload = resolve;
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-picker-api';
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      window.gapi.load('picker', resolve);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
