import React, { useEffect, useState, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './Map.css';

const Map = () => {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markerRef = useRef(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
          mapRef.current.flyTo({
            center: [longitude, latitude],
            zoom: 14,
            essential: true,
          });

          // 現在位置にマーカーを追加
          try {
            // 既存のマーカーを削除
            if (markerRef.current) {
              markerRef.current.remove();
            }

            // 新しいマーカーを作成
            const marker = new maplibregl.Marker({
              color: '#FF0000'
            })
              .setLngLat([longitude, latitude])
              .addTo(mapRef.current);

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
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // 地図をリセットする関数
  const resetMap = () => {
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

  return (
    <div>
      <h2>位置情報検出アプリ</h2>
      <div className="controls">
        <button onClick={getCurrentLocation} disabled={loading}>
          {loading ? '取得中...' : '現在位置を取得'}
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
        </div>
      )}
    </div>
  );
};

export default Map;
