/* global window */
import React, { useState, useEffect, useCallback } from 'react';
import { _MapContext as MapContext, StaticMap, NavigationControl, ScaleControl, FlyToInterpolator } from 'react-map-gl';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import DeckGL from '@deck.gl/react';
import { useSubscribe, usePublish, useUnsubscribe } from '@/utils/usePubSub';
import { useInterval } from 'ahooks';
import { AmbientLight, LightingEffect, MapView, FirstPersonView, _SunLight as SunLight } from '@deck.gl/core';
import { BitmapLayer, IconLayer } from '@deck.gl/layers';
import { TileLayer, TripsLayer } from '@deck.gl/geo-layers';
import { NodeIndexOutlined } from '@ant-design/icons';
//redux
import { useDispatch, useMappedState } from 'redux-react-hook'
import {
  setTripsinfo_tmp,
  setPlay_tmp,
  setTime_tmp,
  setMarks_tmp,
  setshowplayinfo_tmp,
  setanimationSpeed_tmp,
  settrajColor1_tmp,
  settrajColor2_tmp,
  settrailLength_tmp,
  settrajwidth_tmp,
  setTimelineval_tmp,
  settrajlight_tmp
} from '@/redux/actions/traj'
import { utctostrtime } from '@/utils/utctostrtime';

const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoibmkxbzEiLCJhIjoiY2t3ZDgzMmR5NDF4czJ1cm84Z3NqOGt3OSJ9.yOYP6pxDzXzhbHfyk3uORg';

export default function Deckmap() {
  const unsubscribe = useUnsubscribe();//清除更新组件重复订阅的副作用
  const [ismount, setismount] = useState(false)
  useEffect(() => { setismount(true) }, [])
  /*
    ---------------redux中取出变量---------------
  */
  //#region
  const mapState = useCallback(
    state => ({
      traj: state.traj
    }),
    []
  );
  const { traj } = useMappedState(mapState);
  const { tripsinfo, play, time, marks,trajlight_isshow, showplayinfo, trajColor1, trajColor2, trailLength, trajwidth, timelineval } = traj
  //dispatch
  const dispatch = useDispatch()
  const setTripsinfo = (data) => {
    dispatch(setTripsinfo_tmp(data))
  }

  const setPlay = (data) => {
    dispatch(setPlay_tmp(data))
  }
  const setTime = (data) => {
    dispatch(setTime_tmp(data))
  }
  const setMarks = (data) => {
    dispatch(setMarks_tmp(data))
  }
  const setshowplayinfo = (data) => {
    dispatch(setshowplayinfo_tmp(data))
  }
  const settrajColor1 = (data) => {
    dispatch(settrajColor1_tmp(data))
  }
  const settrajColor2 = (data) => {
    dispatch(settrajColor2_tmp(data))
  }
  const settrailLength = (data) => {
    dispatch(settrailLength_tmp(data))
  }
  const settrajwidth = (data) => {
    dispatch(settrajwidth_tmp(data))
  }
  const setTimelineval = (data) => {
    dispatch(setTimelineval_tmp(data))
  }
  //#endregion
  /*
  ---------------地图底图设置---------------
  */
  //#region
  //管理光强度
  const [lightintensity, setlightintensity] = useState(2)
  unsubscribe('lightintensity')
  useSubscribe('lightintensity', function (msg: any, data: any) {
    setlightintensity(data)
  });

  //管理光角度X
  const [lightx, setlightx] = useState(1554937300)
  unsubscribe('lightx')
  useSubscribe('lightx', function (msg: any, data: any) {
    setlightx(data)
  });

  //地图光效
  const ambientLight = new AmbientLight({
    color: [255, 255, 255],
    intensity: 1.0
  });


  const sunLight = new SunLight({
    timestamp: lightx,
    color: [255, 255, 255],
    intensity: lightintensity
  });
  const lightingEffect = new LightingEffect({ ambientLight, sunLight });

  const material = {
    ambient: 0.1,
    diffuse: 0.6,
    shininess: 22,
    specularColor: [60, 64, 70]
  };

  const theme = {
    buildingColor: [255, 255, 255],
    trailColor0: [253, 128, 93],
    trailColor1: [23, 184, 190],
    material,
    effects: [lightingEffect]
  };

  //设定默认地图中心点
  const [viewState, setViewState] = React.useState({
    longitude: 121.391,
    latitude: 31.2011,
    zoom: 10,
    pitch: 45,
    bearing: 0
  });

  //默认地图底图
  const [mapStyle, setMapStyle] = React.useState('dark-v9');
  const publish = usePublish();

  //订阅地图样式
  unsubscribe('mapstyle')
  useSubscribe('mapstyle', function (msg: any, data: any) {
    setMapStyle(data)
  });


  useEffect(() => {
    //允许右键旋转视角
    document.getElementById("deckgl-wrapper").addEventListener("contextmenu", evt => evt.preventDefault());
  }, [])

  //第一人称底图
  const minimapBackgroundStyle = {
    position: 'absolute',
    zIndex: -1,
    width: '100%',
    height: '100%',
    background: '#aaa',
    boxShadow: '0 0 8px 2px rgba(0,0,0,0.15)'
  };
  //#endregion
  /*
  ---------------地图旋转按钮---------------
  */
  //#region
  //旋转的函数
  function rotate(pitch, bearing, duration) {
    setViewState({
      ...viewState,
      pitch: pitch,
      bearing: bearing,
      transitionDuration: duration,
      transitionInterpolator: new FlyToInterpolator(),
    });
  }
  const [angle, setangle] = useState(120);
  const [interval, setInterval] = useState(undefined);
  useInterval(() => {
    rotate(viewState.pitch, angle, 2000)
    setangle(angle => angle + 30)
  }, interval, { immediate: true });
  //旋转的按钮
  function rotatecam() {
    setangle(viewState.bearing + 30)
    if (interval != 2000) {
      setInterval(2000)
    } else {
      setInterval(undefined)
      setViewState(viewState)
    }
  };
  //镜头旋转工具
  const [fristperson_isshow, setfristperson_isshow] = useState(false)
  const cameraTools = (
    <div className="mapboxgl-ctrl-group mapboxgl-ctrl">
      <button
        title="Rotatecam"
        onClick={rotatecam}
        style={{ opacity: interval == 2000 ? 1 : 0.2 }}
      > <span className="iconfont icon-camrotate" /></button>
      <button
        title="fristpersoncontrol"
        onClick={() => {
          setfristperson_isshow(!fristperson_isshow)
        }}
        style={{ opacity: fristperson_isshow ? 1 : 0.2 }}
      >
        <span className="iconfont icon-firstperson" /></button>
    </div>
  );
  //#endregion

  //#endregion
  /*
---------------轨迹动画设置---------------
*/
  //#region

  //轨迹动画特效
  const [animation] = useState({});

  const [time_here, setTime_here] = useState(0);

  //订阅播放速度
  const [animationSpeed, setanimationSpeed] = useState(1)
  unsubscribe('animationSpeed')
  useSubscribe('animationSpeed', function (msg: any, data: any) {
    setanimationSpeed(data)
  });

  const animate = () => {
    setTime_here(t => {
      //发布动画的时间信息
      setMarks({
        0: utctostrtime(tripsinfo.starttime).slice(0, 20),
        [100 * t / tripsinfo['loopLength']]: utctostrtime(tripsinfo.starttime + t * 1000).slice(0, 20),
        100: utctostrtime(tripsinfo.starttime + tripsinfo.loopLength * 1000).slice(0, 20)
      })
      setTimelineval(100 * t / tripsinfo['loopLength'])
      return (t + animationSpeed) % tripsinfo['loopLength']
    });
  };
  //订阅播放位置,实现可拖动效果
  unsubscribe('playtime')
  useSubscribe('playtime', function (msg: any, data: any) {
    setTime_here(tripsinfo.loopLength * data / 100)

  });

  //挂载时触发动画,但只有play是true的时候播放
  useEffect(() => {
    if (play) {
      animation.id = window.requestAnimationFrame(animate);
    }
    return () => window.cancelAnimationFrame(animation.id);
  });

  //订阅轨迹数据
  useEffect(() => {
    //收到轨迹数据时触发动画
    if(ismount){
    if (tripsinfo.trips.length > 0) {
      setPlay(true)
      setshowplayinfo(true)
      setViewState({
        ...viewState,
        longitude: parseFloat(tripsinfo.trips[0].geometry.coordinates[0][0]),
        latitude: parseFloat(tripsinfo.trips[0].geometry.coordinates[0][1])
      })
    }
    else {
      setPlay(false)
      setshowplayinfo(false)
    }}
  }, [tripsinfo])





  //#endregion
  /*
  ---------------地图图层设置---------------
  */
  //#region
  const [trajlayer_isshow, settrajlayer_isshow] = useState(true)
  const layerTools = (
    <div className="mapboxgl-ctrl-group mapboxgl-ctrl" background='#aaa'>
      <button
        title="trajcontrol"
        onClick={() => { settrajlayer_isshow(!trajlayer_isshow) }}
        style={{ opacity: trajlayer_isshow ? 1 : 0.2 }}
      >
        <NodeIndexOutlined />
      </button>
    </div>
  );

  const layers = [
    fristperson_isshow ? new TileLayer({
      // https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#Tile_servers
      data: `https://api.mapbox.com/styles/v1/mapbox/${mapStyle}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibmkxbzEiLCJhIjoiY2t3ZDgzMmR5NDF4czJ1cm84Z3NqOGt3OSJ9.yOYP6pxDzXzhbHfyk3uORg`,
      minZoom: 0,
      maxZoom: 19,
      tileSize: 512,
      renderSubLayers: props => {
        const {
          bbox: { west, south, east, north }
        } = props.tile;
        return new BitmapLayer(props, {
          data: null,
          image: props.data,
          bounds: [west, south, east, north]
        });
      }
    }) : null,
    fristperson_isshow ? new IconLayer({//第一人称位置
      id: 'ref-point',
      data: [{
        color: [68, 142, 247],
        coords: [viewState.longitude, viewState.latitude]
      }],
      iconAtlas: 'images/firstperson.png',
      iconMapping: {
        marker: { x: 0, y: 0, width: 200, height: 200, mask: true }
      },
      sizeScale: 5,
      getIcon: d => 'marker',
      getPosition: d => [...d.coords, 30],
      getSize: d => 5,
      getColor: d => d.color
    }) : null,
    trajlayer_isshow ? trajlight_isshow? new TripsLayer({
      id: 'trips1',
      data: tripsinfo['trips'],
      getPath: d => d.geometry.coordinates,
      getTimestamps: d => d.properties.timestamp,
      getColor: trajColor2.slice(0, 3),
      opacity: 0.1,
      widthMinPixels: 6 * trajwidth,
      trailLength,
      currentTime: time_here,
      shadowEnabled: false
    }) : null:null,
    trajlayer_isshow ? new TripsLayer({
      id: 'trips3',
      data: tripsinfo['trips'],
      getPath: d => d.geometry.coordinates,
      getTimestamps: d => d.properties.timestamp,
      getColor: trajColor1.slice(0, 3),
      opacity: 0.4,
      widthMinPixels: trajwidth,
      trailLength,
      currentTime: time_here,
      shadowEnabled: false,
    }) : null,
  ];
  //#endregion
  /*
  ---------------渲染地图---------------
  */
  //#region
  const onViewStateChange = (newviewState) => {
    const { viewId } = newviewState
    const nviewState = newviewState.viewState
    if (viewId == 'firstPerson') {
      setViewState({ ...viewState, longitude: nviewState.longitude, latitude: nviewState.latitude, bearing: nviewState.bearing })
    } else if (viewId == 'baseMap') {
      setViewState({ ...viewState, longitude: nviewState.longitude, latitude: nviewState.latitude, pitch: nviewState.pitch, bearing: nviewState.bearing, zoom: nviewState.zoom })
    }
  }
  return (
    <DeckGL
      layers={layers}
      initialViewState={{
        'baseMap': viewState, 'firstPerson': {
          ...viewState, pitch: 0, zoom: 0, position: [0, 0, 2], transitionDuration: undefined,
          transitionInterpolator: undefined
        }
      }}
      effects={theme.effects}
      controller={{ doubleClickZoom: false, inertia: true, touchRotate: true }}
      style={{ zIndex: 0 }}
      ContextProvider={MapContext.Provider}
      onViewStateChange={onViewStateChange}
    >
      <MapView id="baseMap"
        controller={true}
        y="0%"
        height="100%"
        position={
          [0, 0, 0]}>
        <StaticMap reuseMaps
          mapboxApiAccessToken={MAPBOX_ACCESS_TOKEN}
          mapStyle={`mapbox://styles/mapbox/${mapStyle}`}
          preventStyleDiffing={true} >
          <div className='mapboxgl-ctrl-bottom-left' style={{ bottom: '20px' }}>
            <ScaleControl maxWidth={100} unit="metric" />
          </div>
        </StaticMap>
        <div className='mapboxgl-ctrl-bottom-right' style={{ bottom: '80px' }}>
          <NavigationControl onViewportChange={viewport => setViewState(viewport)} />
          {cameraTools}
          {layerTools}
        </div>
      </MapView>
      {fristperson_isshow && (<FirstPersonView id="firstPerson"
        controller={{ scrollZoom: false, dragRotate: true, inertia: true }}
        far={10000}
        focalDistance={1.5}
        x={'68%'}
        y={20}
        width={'30%'}
        height={'50%'}
        clear={true}>
        <div style={minimapBackgroundStyle} /> </FirstPersonView>)}
    </DeckGL>
  );
}
//#endregion