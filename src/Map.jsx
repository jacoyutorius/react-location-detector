import React, { useEffect, useState, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './Map.css';

const Map = () => {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markerRef = useRef(null);
  const watchIdRef = useRef(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isWatching, setIsWatching] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(14); // 現在のズーム倍率を保持

  // 地図の初期化
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Amazon Location Service APIキーを環境変数から取得
    const apiKey = import.meta.env.VITE_MAP_API_KEY;
    
    if (!apiKey) {
      setError('APIキーが設定されていません。');
      return;
    }

    // MapLibre GL JSを使用して地図を初期化
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: [
              'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap Contributors'
          }
        },
        layers: [
          {
            id: 'osm-layer',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      },
      center: [139.7670, 35.6814], // 東京の座標
      zoom: 10
    });

    // Amazon Location Serviceの地図スタイルを試みる
    // 注: 403エラーが発生する場合は、OpenStreetMapを使用
    try {
      fetch(`https://maps.geo.ap-northeast-1.amazonaws.com/maps/v0/maps/explore.map/style-descriptor?key=${apiKey}`)
        .then(response => {
          if (response.ok) {
            map.setStyle(`https://maps.geo.ap-northeast-1.amazonaws.com/maps/v0/maps/explore.map/style-descriptor?key=${apiKey}`);
          }
        })
        .catch(error => {
          console.error('Amazon Location Service地図読み込みエラー:', error);
        });
    } catch (error) {
      console.error('地図スタイル設定エラー:', error);
    }

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(new maplibregl.ScaleControl(), 'bottom-left');

    // ズーム変更イベントリスナーを追加
    map.on('zoom', () => {
      if (map) {
        setCurrentZoom(map.getZoom());
      }
    });

    mapRef.current = map;

    return () => {
      if (map) map.remove();
    };
  }, []);

  // 現在位置を取得する関数
  const getCurrentLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('お使いのブラウザはGeolocationをサポートしていません。');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({
          latitude,
          longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp).toLocaleString(),
        });

        // 地図を現在位置に移動
        if (mapRef.current) {
          // 初回取得時は14、それ以降は現在のズーム倍率を使用
          const zoom = location ? currentZoom : 14;
          mapRef.current.flyTo({
            center: [longitude, latitude],
            zoom: zoom,
            essential: true,
          });

          // 現在位置にマーカーを追加
          try {
            // 既存のマーカーを削除
            if (markerRef.current) {
              markerRef.current.remove();
            }

            // カスタムピン要素を作成
            const el = document.createElement('div');
            el.className = 'custom-marker';
            
            // ピンのHTML構造を設定
            el.innerHTML = `
              <div class="pin-container">
                <div class="pin"></div>
                <div class="pin-effect"></div>
              </div>
            `;
            
            // 新しいマーカーを作成
            const marker = new maplibregl.Marker({
              element: el,
              anchor: 'bottom'
            })
              .setLngLat([longitude, latitude])
              .addTo(mapRef.current);
            
            // ポップアップを追加
            const popup = new maplibregl.Popup({ offset: 25 })
              .setHTML(`
                <div class="popup-content">
                  <h4>現在位置</h4>
                  <p>緯度: ${latitude.toFixed(6)}</p>
                  <p>経度: ${longitude.toFixed(6)}</p>
                </div>
              `);
            
            // マーカークリック時にポップアップを表示
            el.addEventListener('click', () => {
              marker.setPopup(popup);
              popup.addTo(mapRef.current);
            });

            markerRef.current = marker;
          } catch (error) {
            console.error('マーカー追加エラー:', error);
          }
        }

        setLoading(false);
      },
      (error) => {
        console.error('位置情報の取得エラー:', error);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError('位置情報へのアクセスが拒否されました。');
            break;
          case error.POSITION_UNAVAILABLE:
            setError('位置情報が利用できません。');
            break;
          case error.TIMEOUT:
            setError('位置情報の取得がタイムアウトしました。');
            break;
          default:
            setError('位置情報の取得中に不明なエラーが発生しました。');
            break;
        }
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000, // タイムアウト時間を30秒に設定
        maximumAge: 0,
      }
    );
  };

  // 位置情報の監視を開始する関数
  const startWatchingPosition = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('お使いのブラウザはGeolocationをサポートしていません。');
      setLoading(false);
      return;
    }

    // 既存の監視を停止
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    // 位置情報の変更を監視
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({
          latitude,
          longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp).toLocaleString(),
        });

        // 地図を現在位置に移動
        if (mapRef.current) {
          // 現在のズーム倍率を使用
          mapRef.current.flyTo({
            center: [longitude, latitude],
            zoom: currentZoom,
            essential: true,
          });

          // 現在位置にマーカーを更新
          try {
            // 既存のマーカーを削除
            if (markerRef.current) {
              markerRef.current.remove();
            }

            // カスタムピン要素を作成
            const el = document.createElement('div');
            el.className = 'custom-marker';
            
            // ピンのHTML構造を設定
            el.innerHTML = `
              <div class="pin-container">
                <div class="pin"></div>
                <div class="pin-effect"></div>
              </div>
            `;
            
            // 新しいマーカーを作成
            const marker = new maplibregl.Marker({
              element: el,
              anchor: 'bottom'
            })
              .setLngLat([longitude, latitude])
              .addTo(mapRef.current);
            
            // ポップアップを追加
            const popup = new maplibregl.Popup({ offset: 25 })
              .setHTML(`
                <div class="popup-content">
                  <h4>現在位置</h4>
                  <p>緯度: ${latitude.toFixed(6)}</p>
                  <p>経度: ${longitude.toFixed(6)}</p>
                  <p>精度: ${position.coords.accuracy.toFixed(2)} メートル</p>
                  <p>更新時刻: ${new Date(position.timestamp).toLocaleString()}</p>
                </div>
              `);
            
            // マーカークリック時にポップアップを表示
            el.addEventListener('click', () => {
              marker.setPopup(popup);
              popup.addTo(mapRef.current);
            });

            markerRef.current = marker;
          } catch (error) {
            console.error('マーカー更新エラー:', error);
          }
        }

        setLoading(false);
        setIsWatching(true);
      },
      (error) => {
        console.error('位置情報の監視エラー:', error);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError('位置情報へのアクセスが拒否されました。');
            break;
          case error.POSITION_UNAVAILABLE:
            setError('位置情報が利用できません。');
            break;
          case error.TIMEOUT:
            setError('位置情報の取得がタイムアウトしました。');
            break;
          default:
            setError('位置情報の監視中に不明なエラーが発生しました。');
            break;
        }
        setLoading(false);
        setIsWatching(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000, // タイムアウト時間を30秒に設定
        maximumAge: 0,
      }
    );
  };

  // 位置情報の監視を停止する関数
  const stopWatchingPosition = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsWatching(false);
    }
  };

  // 地図をリセットする関数
  const resetMap = () => {
    // 位置情報の監視を停止
    stopWatchingPosition();

    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [139.7670, 35.6814], // 東京の座標
        zoom: 10,
        essential: true,
      });

      // マーカーを削除
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    }
    setLocation(null);
  };

  // コンポーネントのアンマウント時に監視を停止
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <div>
      <div className="controls">
        <button onClick={getCurrentLocation} disabled={loading || isWatching}>
          {loading ? '取得中...' : '現在位置を取得'}
        </button>
        <button 
          onClick={isWatching ? stopWatchingPosition : startWatchingPosition} 
          disabled={loading}
        >
          {isWatching ? '監視を停止' : '位置情報を監視'}
        </button>
        <button onClick={resetMap} disabled={loading || !location}>
          リセット
        </button>
      </div>

      <div className="map-container">
        <div ref={mapContainerRef} className="map-wrapper" />
        {loading && <div className="loading">位置情報を取得中...</div>}
      </div>

      {error && <div className="error-message">{error}</div>}

      {location && (
        <div className="location-info">
          <h3>現在位置情報</h3>
          <p>緯度: {location.latitude}</p>
          <p>経度: {location.longitude}</p>
          <p>精度: {location.accuracy} メートル</p>
          <p>取得時刻: {location.timestamp}</p>
          {isWatching && <p className="watching-status">位置情報を監視中...</p>}
        </div>
      )}
    </div>
  );
};

export default Map;
