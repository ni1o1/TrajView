import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Avatar, message, Form, Switch, Select, Table, Upload, Button, Slider, Row, Popover, Col, Card, Collapse, Tooltip, Modal } from 'antd';

import {
    InfoCircleOutlined
} from '@ant-design/icons';
import { SketchPicker } from 'react-color';
import { nanoid } from 'nanoid';
import moment from 'moment';
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
//多线程计算
import useWebWorker from "react-webworker-hook";

const csv = require('csvtojson')
const { Panel } = Collapse;
const { Option } = Select;
export default function Hourlytraj() {

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
    const { tripsinfo, play, time, marks, trajlight_isshow, showplayinfo, animationSpeed, trajColor1, trajColor2, trailLength, trajwidth, timelineval } = traj
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
    const setanimationSpeed = (data) => {
        dispatch(setanimationSpeed_tmp(data))
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
    const settrajlight = (data) => {
        dispatch(settrajlight_tmp(data))
    }
    //#endregion


    /*
      ---------------轨迹属性管理---------------
    */
    //#region
    const [popovervisible, setpopovervisible] = useState(false)
    const [popovervisible2, setpopovervisible2] = useState(false)
    //管理轨迹颜色1
    const [trajColor1_here, settrajColor1_here] = useState({ r: trajColor1[0], g: trajColor1[1], b: trajColor1[2], a: trajColor1[3] })
    function handlecolorChange1(color) {
        settrajColor1_here(color.rgb);
        settrajColor1([color.rgb.r, color.rgb.g, color.rgb.b, color.rgb.a])
    };
    //管理轨迹颜色2
    const [trajColor2_here, settrajColor2_here] = useState({ r: trajColor2[0], g: trajColor2[1], b: trajColor2[2], a: trajColor2[3] })
    function handlecolorChange2(color) {
        settrajColor2_here(color.rgb);
        settrajColor2([color.rgb.r, color.rgb.g, color.rgb.b, color.rgb.a])
    };
    //管理轨迹宽度
    function handleawidthChange(w) {
        settrajwidth(w);
    };
    //管理轨迹宽度
    function handletrailLengthChange(w) {
        settrailLength(w);
    };
    //#endregion

    /*
      ---------------轨迹数据管理---------------
    */
    //#region
    const handleupload_traj = (file) => {
        message.loading({ content: '读取数据中', key: 'readcsv', duration: 0 })
        return new Promise(resolve => {
            setshowplayinfo(false)
            const reader = new FileReader();
            reader.readAsText(file)
            reader.onload = function (f) {
                const data = f.target.result
                let csvoption
                if (data.slice(0, data.indexOf('\n')).split(',').map(f => isNaN(f[0])).indexOf(false) == -1) {
                    //有列名
                    csvoption = {}
                } else {
                    //无列名
                    csvoption = {
                        noheader: true
                    }
                }
                csv(csvoption).fromString(data).then((jsonObj) => {
                    message.destroy('readcsv')
                    setisModalVisible(true)
                    const columns = []
                    Object.keys(jsonObj[0]).forEach(function (key) {
                        columns.push({ 'title': key, 'dataIndex': key, 'key': key })
                    })
                    setTableinfo({ ...tableinfo, columns, data: jsonObj })
                    const columnsnames = columns.map(f => f.key)
                    const ID = columnsnames[columnsnames.map(f => f.toLowerCase().indexOf('id') >= 0).indexOf(true)]
                    const Time = columnsnames[columnsnames.map(f => f.toLowerCase().indexOf('time') >= 0).indexOf(true)]
                    const Lon = columnsnames[columnsnames.map(f => f.toLowerCase().indexOf('lon') >= 0).indexOf(true)]
                    const Lng = columnsnames[columnsnames.map(f => f.toLowerCase().indexOf('lng') >= 0).indexOf(true)]
                    const Lat = columnsnames[columnsnames.map(f => f.toLowerCase().indexOf('lat') >= 0).indexOf(true)]
                    form.setFieldsValue({
                        ID: typeof ID === 'undefined' ? columnsnames[0] : ID,
                        Time: typeof Time === 'undefined' ? columnsnames[1] : Time,
                        Lon: typeof Lon === 'undefined' ? typeof Lng === 'undefined' ? columnsnames[2] : Lng : Lon,
                        Lat: typeof Lat === 'undefined' ? columnsnames[3] : Lat,
                    })
                })
            }
        })
    }
    const [tableinfo, setTableinfo] = useState({
        columns: [],
        data: [],
        count: 0,
        current: 1
    })
    //表单连接
    const [form] = Form.useForm()
    const [isModalVisible, setisModalVisible] = useState(false)

    //后台整理数据
    const [dataprocessed = 0, processdata] = useWebWorker({
        url: "./js/processdata.js"
    });

    const settraj = () => {
        setisModalVisible(false)
        const field = form.getFieldValue()
        message.loading({ content: '整理数据中', key: 'processdata', duration: 0 })
        processdata([field, tableinfo])
    }

    useEffect(() => {
        if (dataprocessed != 0) {
            message.destroy('processdata')
            setTripsinfo(dataprocessed[0])
        }
    }, [dataprocessed])

    //#endregion
    return (
        <>
            <Col span={24}>
                <Card title="轨迹"
                    bordered={false}>
                    <Collapse defaultActiveKey={['Trajectory-Echarts-1', 'Traj-Settings']}>
                        <Panel header="数据管理" key="Trajectory-Echarts-1">
                            <Row gutters={4}>
                                <Col>
                                    <Upload showUploadList={false} beforeUpload={handleupload_traj}><Button type='primary'>导入轨迹数据</Button></Upload>
                                </Col>

                            </Row>

                        </Panel>
                        <Panel header="轨迹设置" key="Traj-Settings">
                            <Row gutter={16}>
                                <Col span={6} key='trajColor'>
                                    <h4>轨迹颜色</h4>
                                    <Popover
                                        content={<SketchPicker
                                            color={trajColor1_here}
                                            onChange={handlecolorChange1}
                                        />}
                                        visible={popovervisible}
                                        onVisibleChange={visible => setpopovervisible(visible)}
                                        trigger="click"
                                    >
                                        <Avatar shape="square" size="small" onClick={() => {
                                            setpopovervisible(!popovervisible)
                                        }} style={{ backgroundColor: `rgba(${trajColor1_here.r},${trajColor1_here.g},${trajColor1_here.b},${trajColor1_here.a})` }}></Avatar>
                                    </Popover>
                                </Col>
                                <Col span={6} key='trajColor2'>
                                    <h4>光效颜色</h4>
                                    <Popover
                                        content={<SketchPicker
                                            color={trajColor2_here}
                                            onChange={handlecolorChange2}
                                        />}
                                        visible={popovervisible2}
                                        onVisibleChange={visible => setpopovervisible2(visible)}
                                        trigger="click"
                                    >
                                        <Avatar shape="square" size="small" onClick={() => {
                                            setpopovervisible2(!popovervisible2)
                                        }} style={{ backgroundColor: `rgba(${trajColor2_here.r},${trajColor2_here.g},${trajColor2_here.b},${trajColor2_here.a})` }}></Avatar>
                                    </Popover>
                                </Col>
                                <Col span={6} key='Tail'>
                                    <h4>尾长: {trailLength}</h4>
                                    <Slider
                                        min={0}
                                        max={300}
                                        onChange={handletrailLengthChange}
                                        value={typeof trailLength === 'number' ? trailLength : 0}
                                        step={1}
                                    />
                                </Col>
                                <Col span={6} key='trajwidth'>
                                    <h4>宽度: {trajwidth}</h4>
                                    <Slider
                                        min={0.1}
                                        max={5}
                                        onChange={handleawidthChange}
                                        value={typeof trajwidth === 'number' ? trajwidth : 0}
                                        step={0.1}
                                    />
                                </Col>
                            </Row>
                            <Row>
                                <Col span={6} key='trajwidth'>
                                    <h4>光效</h4>
                                    <Switch checked={trajlight_isshow} checkedChildren="on" unCheckedChildren="off" onChange={() => {
                                        settrajlight(!trajlight_isshow)
                                    }} />
                                </Col>
                            </Row>
                        </Panel>
                    </Collapse>
                </Card>
            </Col>
            <Modal key="model" title="轨迹数据预览"
                width='80vw'
                height='80vh'
                visible={isModalVisible} onOk={settraj} onCancel={() => {
                    setisModalVisible(false)
                }}>


                <Form
                    name="basic"
                    form={form}
                    labelCol={{ span: 6 }}
                    wrapperCol={{ span: 16 }}
                    initialValues={{ remember: true }}
                    autoComplete="off"
                >
                    <Row>
                        <Col span={6}>
                            <Form.Item name="ID" label="个体(ID)">
                                <Select style={{ width: 120 }}>
                                    {tableinfo.columns.map(v => { return <Option value={v.key}>{v.key}</Option> })}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item name="Time" label="时间(Time)">
                                <Select style={{ width: 120 }}>
                                    {tableinfo.columns.map(v => { return <Option value={v.key}>{v.key}</Option> })}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item name="Lon" label="经度(Lon)">
                                <Select style={{ width: 120 }}>
                                    {tableinfo.columns.map(v => { return <Option value={v.key}>{v.key}</Option> })}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item name="Lat" label="纬度(Lat)">
                                <Select style={{ width: 120 }}>
                                    {tableinfo.columns.map(v => { return <Option value={v.key}>{v.key}</Option> })}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
                <Table columns={tableinfo.columns}
                    dataSource={tableinfo.data}
                    rowKey={columns => nanoid()}
                    scroll={{ x: '100%' }}
                    size='small'
                    style={{
                        'overflowX': 'auto',
                        'overflowY': 'auto'
                    }} />
            </Modal>
        </>
    )

}