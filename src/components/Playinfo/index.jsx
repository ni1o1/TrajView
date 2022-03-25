import React, { useEffect, useCallback, useState } from 'react';
import { Button, Slider, Row, Col, Popover, Card } from 'antd';
import { CaretRightOutlined, PauseOutlined } from '@ant-design/icons';
import { utctostrtime } from '@/utils/utctostrtime';
import { useSubscribe, usePublish, useUnsubscribe } from '@/utils/usePubSub';
import { publish } from 'pubsub-js';

//redux
import { useDispatch, useMappedState } from 'redux-react-hook'
import {
    setTripsinfo_tmp,
    setPlay_tmp,
    setTime_tmp,
    setMarks_tmp,
    setshowplayinfo_tmp,
    settrajColor1_tmp,
    settrajColor2_tmp,
    settrailLength_tmp,
    settrajwidth_tmp,
    setTimelineval_tmp
} from '@/redux/actions/traj'



export default function Playinfo() {
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
    const { tripsinfo, play, time, marks, showplayinfo, trajColor1, trajColor2, trailLength, trajwidth, timelineval } = traj
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


    //拖动进度条
    const changetime = (e) => {
        if (play == false) {
            setTimelineval(e)
        }
        setMarks({
            0: marks['0'],
            [e]: e / 100 * ((new Date(marks['100'])).valueOf() - (new Date(marks['0'])).valueOf()) + (new Date(marks['0'])).valueOf(),
            100: marks['100']
        })
        //发布播放位置
        publish('playtime', e)
    }

    const [speed, setSpeed] = useState(1)
    const addspeed = () => {

        let thisspeed = (speed + 1) % 6
        let animationSpeed = thisspeed == 1 ? 1 : thisspeed == 2 ? 2 : thisspeed == 3 ? 5 : thisspeed == 4 ? 10 : thisspeed == 5 ? 60 : 300
        publish('animationSpeed', animationSpeed)
        setSpeed(thisspeed)

    }

    return <Popover visible={showplayinfo} content={<div className="playinfo" >
        <Card size='small'>

            <Row >
                <Col span={2} >
                    <Button type="primary" shape="round" icon={play ? <PauseOutlined /> : <CaretRightOutlined />} onClick={() => {
                        setPlay(!play)
                    }}></Button>
                </Col>
                <Col span={2} >
                    <Button type="primary" shape="round" onClick={addspeed}>{
                        speed == 1 ? '×1' :
                            speed == 2 ? '×2' :
                                speed == 3 ? '×5' :
                                    speed == 4 ? 'x10' : speed == 5 ? 'x60' : 'x300'}</Button>
                </Col>
                <Col offset={1} span={18} >
                    <Slider marks={marks} tooltipVisible={false} value={timelineval} onChange={changetime} />
                </Col>
            </Row>

        </Card></div>}><Button type="primary" className='playinfobtn' ></Button>
    </Popover>
}
