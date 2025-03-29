import React, { useState, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import './Geofence.css';
import {
  listGeofences,
  evaluateGeofences
} from './services/GeofenceService';

// ジオフェンスの色設定
const GEOFENCE_COLORS = {
  INSIDE: '#8BC34A', // ユーザーが中にいるジオフェンス（明るい緑）
  OUTSIDE: '#03A9F4', // ユーザーが外にいるジオフェンス（明るい青）
};

const Geofence = ({ map, userLocation }) => {
  const [geofences, setGeofences] = useState([]);
  const [insideGeofences, setInsideGeofences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // コンポーネントマウント時にジオフェンスを読み込む
  useEffect(() => {
    if (map) {
      loadGeofences();
    }
  }, [map]);

  // ユーザー位置が変更されたときにジオフェンス評価を実行
  useEffect(() => {
    if (userLocation && map) {
      evaluateUserLocation();
    }
  }, [userLocation, geofences]);

  // ジオフェンスを読み込む
  const loadGeofences = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const fetchedGeofences = await listGeofences();
      setGeofences(fetchedGeofences);
      
      // 地図上にジオフェンスを表示
      displayGeofencesOnMap(fetchedGeofences);
      
      setLoading(false);
    } catch (error) {
      console.error('ジオフェンス読み込みエラー:', error);
      setError('ジオフェンスの読み込み中にエラーが発生しました。');
      setLoading(false);
    }
  };

  // 地図上にジオフェンスを表示
  const displayGeofencesOnMap = (geofenceList) => {
    if (!map) return;

    console.log('ジオフェンスを地図に表示:', geofenceList);
    
    // 既存のジオフェンスレイヤーをクリア
    geofenceList.forEach((geofence) => {
      const sourceId = `geofence-source-${geofence.GeofenceId}`;
      const layerId = `geofence-layer-${geofence.GeofenceId}`;
      
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    });
    
    // 新しいジオフェンスを追加
    geofenceList.forEach((geofence) => {
      const sourceId = `geofence-source-${geofence.GeofenceId}`;
      const layerId = `geofence-layer-${geofence.GeofenceId}`;
      
      // ジオフェンスの色を決定
      const color = insideGeofences.includes(geofence.GeofenceId)
        ? GEOFENCE_COLORS.INSIDE
        : GEOFENCE_COLORS.OUTSIDE;
      
      // ジオフェンスのGeoJSONを作成
      let geoJson;
      
      if (geofence.Geometry.Circle) {
        // 円形ジオフェンスの場合
        const center = geofence.Geometry.Circle.Center;
        const radius = geofence.Geometry.Circle.Radius;
        
        // 円を多角形として近似
        const points = 64;
        const coordinates = [];
        
        for (let i = 0; i < points; i++) {
          const angle = (i / points) * (2 * Math.PI);
          const lng = center[0] + (radius / 111320) * Math.cos(angle);
          const lat = center[1] + (radius / 111320) * Math.sin(angle) / Math.cos(center[1] * (Math.PI / 180));
          coordinates.push([lng, lat]);
        }
        
        // 最初の点を最後にも追加して閉じる
        coordinates.push(coordinates[0]);
        
        geoJson = {
          type: 'Feature',
          properties: {
            id: geofence.GeofenceId,
            description: geofence.Description || geofence.GeofenceId,
            type: 'circle',
            radius: radius,
          },
          geometry: {
            type: 'Polygon',
            coordinates: [coordinates],
          },
        };
      } else if (geofence.Geometry.Polygon) {
        // 多角形ジオフェンスの場合
        geoJson = {
          type: 'Feature',
          properties: {
            id: geofence.GeofenceId,
            description: geofence.Description || geofence.GeofenceId,
            type: 'polygon',
          },
          geometry: {
            type: 'Polygon',
            coordinates: geofence.Geometry.Polygon,
          },
        };
      }
      
      // ソースとレイヤーを追加
      if (geoJson) {
        map.addSource(sourceId, {
          type: 'geojson',
          data: geoJson,
        });
        
        map.addLayer({
          id: layerId,
          type: 'fill',
          source: sourceId,
          paint: {
            'fill-color': color,
            'fill-opacity': 0.3,
          },
        });
        
        // 境界線レイヤーを追加
        map.addLayer({
          id: `${layerId}-outline`,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': color,
            'line-width': 2,
          },
        });
        
        // クリックイベントを追加
        map.on('click', layerId, (e) => {
          const features = map.queryRenderedFeatures(e.point, { layers: [layerId] });
          if (features.length > 0) {
            const geofenceId = features[0].properties.id;
            
            // ポップアップを表示
            new maplibregl.Popup()
              .setLngLat(e.lngLat)
              .setHTML(`
                <div class="geofence-popup">
                  <h4>${features[0].properties.description}</h4>
                  <p>ID: ${geofenceId}</p>
                  ${features[0].properties.type === 'circle' 
                    ? `<p>半径: ${features[0].properties.radius}m</p>` 
                    : ''}
                  <p>ステータス: ${insideGeofences.includes(geofenceId) ? '内部' : '外部'}</p>
                </div>
              `)
              .addTo(map);
          }
        });
      }
    });
  };


  // ユーザー位置がジオフェンス内にあるかを評価
  const evaluateUserLocation = async () => {
    if (!userLocation || geofences.length === 0) return;
    
    try {
      const result = await evaluateGeofences(userLocation.longitude, userLocation.latitude);
      
      // 内部にいるジオフェンスのIDを抽出
      const insideIds = [];
      
      if (result && result.Results) {
        result.Results.forEach(item => {
          if (item.Matches) {
            item.Matches.forEach(match => {
              if (match.Distance && match.Distance.Distance <= 0) {
                insideIds.push(match.GeofenceId);
              }
            });
          }
        });
      }
      
      setInsideGeofences(insideIds);
      
      // 地図上のジオフェンスの色を更新
      displayGeofencesOnMap(geofences);
    } catch (error) {
      console.error('ジオフェンス評価エラー:', error);
    }
  };


  return (
    <div className="geofence-container">
      <div className="geofence-controls">
        <h3>ジオフェンス状態</h3>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="geofence-list">
          <h4>ジオフェンス一覧</h4>
          {loading && <p>読み込み中...</p>}
          
          {geofences.length === 0 ? (
            <p>ジオフェンスがありません。</p>
          ) : (
            <ul>
              {geofences.map((geofence) => (
                <li 
                  key={geofence.GeofenceId}
                  className={`geofence-item ${insideGeofences.includes(geofence.GeofenceId) ? 'inside' : ''}`}
                >
                  <div className="geofence-info">
                    <span className="geofence-name">
                      {geofence.Description || geofence.GeofenceId}
                    </span>
                    <span className="geofence-status">
                      {insideGeofences.includes(geofence.GeofenceId) ? '内部' : '外部'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Geofence;
