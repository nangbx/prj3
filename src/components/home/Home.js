/* eslint-disable no-undef */
import {
    GoogleMap,
    useJsApiLoader,
    Marker,
    InfoWindow,
    InfoBox,
} from "@react-google-maps/api";
import { useState, useEffect } from "react";
import { Row, Col, Tabs, Modal, Tag, Badge, Avatar, Table } from "antd";
import { PlusCircleOutlined, PushpinOutlined } from "@ant-design/icons";
import moment from "moment";
import Geocode from "react-geocode";
import AutoSizer from "react-virtualized-auto-sizer";

import makeRequest from "../../utils/makeRequest";
import { requestUrl } from "../../resource/requestUrl";
import { addListKey } from "../../utils/addListKey";
import { markerIcon } from "../../config/markerIcon";
import FilterSelect from "../filterItem/FilterSelect";
import FilterText from "../filterItem/FilterText";
import omitNil from "../../utils/omit";
import CarBoxInfo from "./CarBoxInfo";
import RouteInfoTable from "./RouteInfoTable";
import { convertDirection } from "../../handle/convertDirection";
import MarkerDTO from "../../DTOs/marker";
import { carConfig } from "../../config/car";
import segmentationHandler from "../../handle/segmentation";
import MemorizeDirection from "../map/MemorizeDirection";
import MemorizeRoutePoint from "../map/MemorizeRoutePoint";
import MemorizePolyline from "../map/MemorizePolyline";
import { mapConfig } from "../../config/map";
//css
import "./Home.css";
import "../../styles/customScrollBar.css";
import HistoryList from "../debugHistory/HistoryList";
import CustomSkeleton from "../skeleton/CustomSkeleton";

const libraries = ["places"];
const timeFormat = "hh:mm:ss";
const dateTimeFormat = "YYYY-MM-DDTHH:mm:ss";
const carMarkerICon = (carsStatus) => {
    if (carsStatus.engineOn === 0) return 10;
    if (carsStatus.engineOn === 1) return 9;
    if (carsStatus.engineOn === 2) return 8;
};
const carHistoryIcon = 7;
const { TabPane } = Tabs;

const Home = () => {
    const [myMap, setMyMap] = useState(null);
    const [center, setCenter] = useState({ lat: 21.0070303, lng: 105.840942 });
    const [assets, setAssets] = useState({
        cars: [],
        displayCars: [],
        userUnits: [],
        segmentations: [],
        sampleRoutes: [],
        drivers: [],
        atmTechnicans: [],
        treasurers: [],
        transactionPoints: [],
    });
    const [descriptionModalVisible, setDescriptionModalVisible] =
        useState(false);
    const [routeModalVisible, setRouteModalVisible] = useState(false);
    const [carsStatus, setCarsStatus] = useState([]);
    const [displayCarsStt, setDisplayCarsStt] = useState([]);
    const [selectedCar, setSelectedCar] = useState(null);
    const [selectedSegmentation, setSelectedSegmentation] = useState(null);
    const [direction, setDirection] = useState(null);
    const [backDirection, setBackDirection] = useState(null);
    const [routePoints, setRoutePoints] = useState([]);
    const [wayPoints, setWayPoints] = useState([]);
    const [routeAutoTurnBack, setRouteAutoTurnBack] = useState(false);
    const [activeMarker, setActiveMarker] = useState(null);
    const [activeInfoWindow, setActiveInfoWindow] = useState(null);
    const [carHistory, setCarHistory] = useState({
        histories: [],
        statistical: {},
    });
    const [selectedHistory, setSelectedHistory] = useState({});
    const [historyPath, setHistoryPath] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isPin, setIsPin] = useState(false);
    const [filter, setFilter] = useState({
        licensePlate: null,
        unitId: null,
    });

    useEffect(() => {
        const getAssets = async () => {
            let today = moment().format("YYYY-MM-DD");
            const [
                carsRs,
                userUnitsRs,
                segmentationsRs,
                sampleRoutesRs,
                driversRs,
                atmTechnicansRs,
                treasurersRs,
                transactionPointsRs,
            ] = await Promise.all([
                makeRequest({
                    method: "GET",
                    url: requestUrl.car.readUrl(),
                    params: {
                        paging: false,
                    },
                }),
                makeRequest({
                    method: "GET",
                    url: requestUrl.userUnit.readUrl(),
                }),
                makeRequest({
                    method: "GET",
                    url: requestUrl.segmentation.readUrl(),
                    params: {
                        beginDate: today.toString(),
                        endDate: today.toString(),
                    },
                }),
                makeRequest({
                    method: "GET",
                    url: requestUrl.route.readUrl(),
                    params: {
                        paging: false,
                    },
                }),
                makeRequest({
                    method: "GET",
                    url: requestUrl.driver.readUrl(),
                    params: {
                        paging: false,
                    },
                }),
                makeRequest({
                    method: "GET",
                    url: requestUrl.treasure.readUrl(),
                    params: {
                        paging: false,
                    },
                }),
                makeRequest({
                    method: "GET",
                    url: requestUrl.atmTechnican.readUrl(),
                    params: {
                        paging: false,
                    },
                }),
                makeRequest({
                    method: "GET",
                    url: requestUrl.transactionPoint.readUrl(),
                    params: {
                        paging: false,
                    },
                }),
            ]);
            setAssets({
                ...assets,
                sampleRoutes: addListKey(sampleRoutesRs.data),
                cars: addListKey(carsRs.data),
                displayCars: addListKey(carsRs.data),
                userUnits: addListKey(userUnitsRs.data),
                segmentations: addListKey(segmentationsRs.data),
                drivers: addListKey(driversRs.data),
                atmTechnicans: addListKey(atmTechnicansRs.data),
                treasurers: addListKey(treasurersRs.data),
                transactionPoints: addListKey(transactionPointsRs.data),
            });
            setLoading(false);
        };

        getAssets();
    }, []);

    // call to get online status every 5s
    // useEffect(() => {
    //   const intervalId = setInterval(() => {
    //     getCarsStatus(false)
    //   }, 5000)
    //   return () => {
    //     clearInterval(intervalId)
    //   }
    // }, [assets.cars])

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: process.env.REACT_APP_GGMAP_KEY,
        libraries,
    });

    Geocode.setApiKey(process.env.REACT_APP_GGMAP_KEY);
    Geocode.setLanguage("vi");

    const reloadSegmentation = () => {
        const today = moment().format("YYYY-MM-DD");
        makeRequest({
            method: "GET",
            url: requestUrl.segmentation.readUrl(),
            params: {
                beginDate: today.toString(),
                endDate: today.toString(),
            },
        }).then((res) => {
            setAssets({ ...assets, segmentations: addListKey(res.data) });
        });
    };

    const handleFilter = (filter) => {
        const omitFilter = omitNil(filter);
        const carsFilter = carsStatus.filter((item) => {
            for (const [key, value] of Object.entries(omitFilter)) {
                if (typeof item["car"][key] === "string") {
                    if (
                        !item["car"][key]
                            .toLowerCase()
                            .includes(value.toLowerCase())
                    )
                        return false;
                } else {
                    if (item["car"][key] !== value) return false;
                }
            }
            return true;
        });

        setDisplayCarsStt(carsFilter);
    };

    const checkRunningSegmentation = (segmentation) => {
        let now = moment();
        let beginTime = moment(segmentation.beginTime, timeFormat);
        let endTime = moment(segmentation.endTime, timeFormat);
        let days = JSON.parse(segmentation.day);
        return (
            now.isBetween(beginTime, endTime) && days.includes(now.isoWeekday())
        );
    };

    const checkPrepareSegmentation = (segmentation) => {
        let now = moment();
        let beginTime = moment(segmentation.beginTime, timeFormat);
        let days = JSON.parse(segmentation.day);
        return beginTime.isAfter(now) && days.includes(now.isoWeekday());
    };

    const checkSegmentationHasRouteEditted = (segmentation) => {
        let { editedSegmentationRoutes } = segmentation;
        if (editedSegmentationRoutes.length === 0) return false;
        else {
            return (
                editedSegmentationRoutes
                    .map((item) => moment(item.editedIn, "YYYY-MM-DD"))
                    .filter((item) => item.isSame(moment(), "day")).length === 1
            );
        }
    };

    const getEditedSegmentationRoute = (segmentation) => {
        let { editedSegmentationRoutes } = segmentation;
        return editedSegmentationRoutes.filter((item) =>
            moment(item.editedIn, "YYYY-MM-DD").isSame(moment(), "day")
        )[0];
    };

    const getCarInfo = (carId) => {
        const currentStatus = carsStatus.filter(
            (item) => item.carId === carId
        )[0];
        const { segmentations, drivers, treasurers, atmTechnicans } = assets;
        const hasSegmentation = segmentations.filter(
            (item) => item.carId === carId
        );
        let carInfo = {};
        if (hasSegmentation.length) {
            const segmentation = hasSegmentation[0];
            carInfo.driver = drivers.filter(
                (item) => item.id === segmentation.driverId
            )[0].name;
            carInfo.treasurer = treasurers.filter(
                (item) => item.id === segmentation.treasurerId
            )[0].name;
            carInfo.atmTechnican = atmTechnicans.filter(
                (item) => item.id === segmentation.atmtechnicanId
            )[0].name;
            carInfo.route = segmentation.route.routeCode;
        }
        Geocode.fromLatLng(currentStatus.gpsLat, currentStatus.gpsLon).then(
            (response) => {
                const address = response.results[0].formatted_address;
                setActiveMarker(carId);
                setActiveInfoWindow({
                    ...carsStatus.filter((item) => item.id === carId)[0],
                    currentAdd: address,
                    ...carInfo,
                });
            },
            (error) => {
                console.log(error);
            }
        );
    };

    const handleActiveMarker = (id) => {
        if (id === activeMarker) {
            return;
        }
        getCarInfo(id);
    };

    const removeActiveMarker = () => {
        setActiveMarker(null);
        setActiveInfoWindow(null);
    };

    const getCarsStatus = (firstTime = true, map) => {
        makeRequest({
            method: "GET",
            url: requestUrl.online.readUrl(),
        }).then((res) => {
            setCarsStatus(res.data);
            setDisplayCarsStt(
                res.data.sort((a, b) => {
                    return b.isSos - a.isSos || a.engineOn - b.engineOn;
                })
            );
            if (firstTime) {
                let boundBuilder = new google.maps.LatLngBounds();
                res.data.forEach((car) => {
                    boundBuilder.extend(
                        new google.maps.LatLng({
                            lat: car.gpsLat,
                            lng: car.gpsLon,
                        })
                    );
                });
                map.fitBounds(boundBuilder, 100);
                // trigger when it not fitbound correctly
                setTimeout(() => {
                    map.fitBounds(boundBuilder, 100);
                }, 100);
            }
        });
    };

    const onSelectCar = (record) => {
        setSelectedCar(record.car.id);
        const position = { lat: record.gpsLat, lng: record.gpsLon };
        setCenter(position);
    };

    const handleEditRoute = (segmentation) => {
        setSelectedSegmentation(segmentation);
        if (checkSegmentationHasRouteEditted(segmentation)) {
            const editedSegmentationRoute =
                getEditedSegmentationRoute(segmentation);
            setRouteAutoTurnBack(editedSegmentationRoute.autoTurnBack);
            setWayPoints(JSON.parse(editedSegmentationRoute.route));
        } else {
            setRouteAutoTurnBack(segmentation.route.autoTurnBack);
            setWayPoints(JSON.parse(segmentation.route.route));
        }
        setRouteModalVisible(true);
    };

    const mergeFitbound = (directionBound, backDirectionBound) => {
        let boundBuilder = new google.maps.LatLngBounds();
        if (directionBound && backDirectionBound) {
            boundBuilder.union(directionBound);
            boundBuilder.union(backDirectionBound);
            // myMap.fitBounds(boundBuilder)
            return boundBuilder;
        }
    };

    const onSelectSegmentation = (segmentation) => {
        setSelectedCar(segmentation.carId);
        let routeInfo, wayPoints, direction, wayBack;
        routeInfo = segmentation.route;
        if (checkSegmentationHasRouteEditted(segmentation)) {
            const editedSegmentationRoute =
                getEditedSegmentationRoute(segmentation);
            wayPoints = JSON.parse(editedSegmentationRoute.route);
            direction = editedSegmentationRoute.direction;
            wayBack = editedSegmentationRoute.wayBack;
        } else {
            wayPoints = JSON.parse(routeInfo.route);
            direction = routeInfo.direction;
            wayBack = routeInfo.wayBack;
        }
        let convertedDirection = convertDirection(JSON.parse(direction));
        let convertedBackDirection = convertDirection(JSON.parse(wayBack));
        const mergeBound = mergeFitbound(
            convertedDirection.routes[0].bounds,
            convertedBackDirection.routes[0].bounds
        );
        convertedDirection.routes[0].bounds = mergeBound;
        convertedBackDirection.routes[0].bounds = mergeBound;
        setDirection(convertedDirection);
        setBackDirection(convertedBackDirection);
        console.log(wayPoints);
        drawRoutePoint(wayPoints, routeInfo.beginTime);
        const today = moment();
        const historyFilter = {
            carId: segmentation.carId,
            beginTime: today
                .set(
                    segmentationHandler.getUpdateTimeObject(
                        segmentation.beginTime
                    )
                )
                .format(dateTimeFormat),
            // endTime: today.format(dateTimeFormat),
            endTime: today.endOf("day").format(dateTimeFormat),
        };

        getCarHistory(historyFilter);
    };

    const drawRoutePoint = (routePoints, beginTime) => {
        const routeInfo = routePoints.map((item) => {
            return assets.transactionPoints.filter(
                (p) => p.id === item.transactionPointId
            )[0];
        });
        console.log(assets.transactionPoints);
        console.log(routeInfo);
        let markerList = routeInfo.map(
            (item, index) =>
                new MarkerDTO(
                    index + 1,
                    item.pointName,
                    {
                        lat: item.latitude,
                        lng: item.longtitude,
                    },
                    item.pointType
                )
        );
        const routeInfoCount = routeInfo.length;
        // get time each point
        let timeList = [];
        let startTime = moment(beginTime, "HH:mm");
        for (let i = 0; i < routeInfoCount; i++) {
            const pointTime = moment(routePoints[i].time, "HH:mm");
            const minute = pointTime.hour() * 60 + pointTime.minute();
            startTime.add(minute, "minutes");
            let timeItem = {
                displayTime: startTime.format("HH:mm"),
            };
            timeList.push(timeItem);
        }

        for (let index = 0; index < routeInfoCount; index++) {
            markerList[index] = { ...markerList[index], ...timeList[index] };
        }
        setRoutePoints(markerList);
    };

    const getCarHistory = (filter, segmentationRouteBound) => {
        setLoading(true);
        makeRequest({
            method: "GET",
            url: requestUrl.history.readUrl(),
            params: filter,
        }).then((rs) => {
            const { histories } = rs.data;
            const point = histories.map((item) => ({
                lat: item.gpsLat,
                lng: item.gpsLon,
            }));
            setCarHistory(rs.data);
            setHistoryPath(point);
            setLoading(false);
        });
    };
    const dataSource = [
        {
            key: "1",
            name: "Mike",
            age: 32,
            address: "10 Downing Street",
        },
        {
            key: "2",
            name: "John",
            age: 42,
            address: "10 Downing Street",
        },
        {
            key: "2",
            name: "John",
            age: 42,
            address: "10 Downing Street",
        },
        {
            key: "2",
            name: "John",
            age: 42,
            address: "10 Downing Street",
        },
        {
            key: "2",
            name: "John",
            age: 42,
            address: "10 Downing Street",
        },
        {
            key: "2",
            name: "John",
            age: 42,
            address: "10 Downing Street",
        },
        {
            key: "2",
            name: "John",
            age: 42,
            address: "10 Downing Street",
        },
    ];

    const columns = [
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
        },
        {
            title: "Age",
            dataIndex: "age",
            key: "age",
        },
        {
            title: "Address",
            dataIndex: "address",
            key: "address",
        },
    ];
    return (
        <Row style={{ height: "100%" }} gutter={[8, 0]}>
            <Col span={3}>
                <Tabs
                    defaultActiveKey="1"
                    className="custom-scroll-bar"
                    style={{ height: "100%" }}
                >
                    <TabPane tab="DS Xe" key="1">
                        <div
                            style={{
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                            }}
                        >
                            <Row gutter={[0, 16]} style={{ marginBottom: 10 }}>
                                <Col span={8} style={{ margin: "auto" }}>
                                    Đơn vị:
                                </Col>
                                <Col span={16}>
                                    <FilterSelect
                                        style={{ width: "100%" }}
                                        dataIndex="unitId"
                                        handleFilter={handleFilter}
                                        filter={filter}
                                        placeholder="Tất cả"
                                        setFilter={setFilter}
                                        data={assets.userUnits.map((item) => ({
                                            value: item.id,
                                            label: item.name,
                                        }))}
                                    />
                                </Col>
                                <Col span={8} style={{ margin: "auto" }}>
                                    Xe:
                                </Col>
                                <Col span={16}>
                                    <FilterText
                                        style={{ width: "100%" }}
                                        dataIndex="licensePlate"
                                        filter={filter}
                                        handleFilter={handleFilter}
                                        setFilter={setFilter}
                                        placeholder=""
                                    />
                                </Col>
                            </Row>
                            <div
                                style={{
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                }}
                            >
                                <div
                                    style={{
                                        textAlign: "center",
                                        backgroundColor: "#58a9cc",
                                        color: "white",
                                    }}
                                >
                                    Danh sách xe
                                </div>
                                <div style={{ flex: "1 1 auto" }}>
                                    <AutoSizer disableWidth>
                                        {({ height, width }) => {
                                            return (
                                                <div
                                                    style={{
                                                        height: height,
                                                        borderRight:
                                                            "1px solid gray",
                                                        borderLeft:
                                                            "1px solid gray",
                                                        borderBottom:
                                                            "1px solid gray",
                                                        overflowY: "auto",
                                                        overflowX: "hidden",
                                                        textAlign: "center",
                                                    }}
                                                    className="custom-scroll-bar"
                                                >
                                                    {displayCarsStt.map(
                                                        (item) => (
                                                            <Badge
                                                                count={
                                                                    item.isSos ? (
                                                                        <p
                                                                            style={{
                                                                                backgroundColor:
                                                                                    "#c300e4",
                                                                                color: "#ffffff",
                                                                                padding:
                                                                                    "3px",
                                                                                borderRadius:
                                                                                    "10px",
                                                                                fontWeight:
                                                                                    "500",
                                                                                fontSize: 10,
                                                                            }}
                                                                        >
                                                                            SOS
                                                                        </p>
                                                                    ) : (
                                                                        ""
                                                                    )
                                                                }
                                                                className="car-stt"
                                                                offset={[
                                                                    -10, 10,
                                                                ]}
                                                            >
                                                                <div
                                                                    style={{
                                                                        border: "1px solid #a4a4a4",
                                                                        padding:
                                                                            "5px 0",
                                                                        cursor: "pointer",
                                                                        textAlign:
                                                                            "center",
                                                                        fontWeight:
                                                                            "bold",
                                                                        color: carConfig.status.filter(
                                                                            (
                                                                                sst
                                                                            ) =>
                                                                                sst.value ===
                                                                                item.engineOn
                                                                        )[0]
                                                                            .textColor,
                                                                        backgroundColor:
                                                                            carConfig.status.filter(
                                                                                (
                                                                                    sst
                                                                                ) =>
                                                                                    sst.value ===
                                                                                    item.engineOn
                                                                            )[0]
                                                                                .color,
                                                                    }}
                                                                    onClick={() => {
                                                                        onSelectCar(
                                                                            item
                                                                        );
                                                                        handleActiveMarker(
                                                                            item
                                                                                .car
                                                                                .id
                                                                        );
                                                                    }}
                                                                >
                                                                    {
                                                                        item.car
                                                                            .licensePlate
                                                                    }
                                                                </div>
                                                            </Badge>
                                                        )
                                                    )}
                                                </div>
                                            );
                                        }}
                                    </AutoSizer>
                                </div>
                            </div>
                        </div>
                    </TabPane>
                    <TabPane tab="Lịch sử chạy xe" key="2">
                        <div style={{ height: "100%" }} className="abc">
                            <HistoryList
                                histories={carHistory.histories}
                                setSelectedHistory={setSelectedHistory}
                            />
                        </div>
                    </TabPane>
                </Tabs>
            </Col>
            <Col span={18}>
                {isLoaded && (
                    <GoogleMap
                        mapContainerStyle={{
                            height: "100%",
                            width: "100%",
                        }}
                        zoom={17}
                        center={center}
                        onLoad={(map) => {
                            getCarsStatus(true, map);
                            setMyMap(map);
                        }}
                        onClick={removeActiveMarker}
                    >
                        {carsStatus.map((car) => (
                            <>
                                <Marker
                                    key={car.id}
                                    position={{
                                        lat: car.gpsLat,
                                        lng: car.gpsLon,
                                    }}
                                    onClick={() => handleActiveMarker(car.id)}
                                    icon={{
                                        url: markerIcon[carMarkerICon(car)],
                                        size: { width: 40, height: 20 },
                                    }}
                                ></Marker>
                                <InfoBox
                                    position={{
                                        lat: car.gpsLat,
                                        lng: car.gpsLon,
                                    }}
                                    key={`infoBox-${car.id}`}
                                    options={{
                                        pixelOffset: new google.maps.Size(
                                            -18,
                                            3
                                        ),
                                        closeBoxURL: "",
                                        enableEventPropagation: true,
                                        boxStyle: {
                                            width: "unset",
                                            border: "thin solid",
                                            padding: "1px",
                                            "border-radius": "3px",
                                            background: "white",
                                        },
                                    }}
                                    zIndex={101}
                                >
                                    <>{car.car.licensePlate}</>
                                </InfoBox>
                            </>
                        ))}
                        {activeInfoWindow ? (
                            <InfoWindow
                                position={{
                                    lat: activeInfoWindow.gpsLat,
                                    lng: activeInfoWindow.gpsLon,
                                }}
                                onCloseClick={removeActiveMarker}
                                options={{
                                    pixelOffset: new google.maps.Size(-8, -20),
                                }}
                                zIndex={102}
                            >
                                <CarBoxInfo
                                    carInfo={activeInfoWindow}
                                    units={assets.userUnits}
                                    setModalVisible={setDescriptionModalVisible}
                                />
                            </InfoWindow>
                        ) : null}
                        <MemorizeDirection
                            direction={direction}
                            options={mapConfig.directionOptions}
                        />
                        <MemorizeDirection
                            direction={backDirection}
                            options={mapConfig.backDirectionOptions}
                        />
                        <MemorizePolyline
                            path={historyPath}
                            options={mapConfig.carHistoryPolylineConfig}
                        />
                        <MemorizeRoutePoint routePoints={routePoints} />
                        {selectedCar ? (
                            carsStatus
                                .filter((item) => item.carId === selectedCar)
                                .map((item) => (
                                    <InfoBox
                                        position={{
                                            lat: item.gpsLat,
                                            lng: item.gpsLon,
                                        }}
                                        options={{
                                            pixelOffset: new google.maps.Size(
                                                -23,
                                                -60
                                            ),
                                            closeBoxURL: "",
                                            enableEventPropagation: true,
                                        }}
                                        zIndex={102}
                                    >
                                        <div className="current-car">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-6 w-6 arrow-down"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                                                />
                                            </svg>
                                        </div>
                                    </InfoBox>
                                ))
                        ) : (
                            <></>
                        )}
                        {selectedHistory ? (
                            <Marker
                                key="car-history-icon"
                                position={{
                                    lat: selectedHistory.gpsLat,
                                    lng: selectedHistory.gpsLon,
                                }}
                                icon={{
                                    url: markerIcon[carHistoryIcon],
                                    size: { width: 24, height: 20 },
                                }}
                            ></Marker>
                        ) : (
                            <></>
                        )}
                    </GoogleMap>
                )}
                <div className={`sos-box ${isPin ? "active" : ""}`}>
                    <PushpinOutlined
                        className="pin-icon"
                        onClick={() => setIsPin(!isPin)}
                    />
                    <h4
                        style={{
                            textAlign: "center",
                            fontWeight: "bold",
                            color: "#ff0000",
                        }}
                    >
                        Cảnh báo
                    </h4>
                    <Table
                        dataSource={dataSource}
                        columns={columns}
                        pagination={false}
                        scroll={{
                            y: 200,
                        }}
                    />
                </div>
                {/** Add table notification */}
                <div></div>
            </Col>
            <Col span={3}>
                <Tabs
                    defaultActiveKey="1"
                    className="custom-scroll-bar"
                    style={{ overflowY: "auto" }}
                >
                    <TabPane tab="Đang chạy" key="1">
                        <div style={{ height: "100%", display: "flex" }}>
                            <div style={{ flex: "1 1 auto" }}>
                                <AutoSizer disableWidth>
                                    {({ height, width }) => (
                                        <div
                                            style={{
                                                height: height,
                                                overflowY: "auto",
                                            }}
                                            className="custom-scroll-bar"
                                        >
                                            {assets.segmentations
                                                .filter((item) =>
                                                    checkRunningSegmentation(
                                                        item
                                                    )
                                                )
                                                .map((item) => (
                                                    <div className="segmentation-item-wrapper">
                                                        <div className="edit-segmentation-btn">
                                                            <PlusCircleOutlined
                                                                style={{
                                                                    fontSize: 20,
                                                                }}
                                                                onClick={() =>
                                                                    handleEditRoute(
                                                                        item
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                        <div
                                                            className="route-code"
                                                            onClick={() =>
                                                                onSelectSegmentation(
                                                                    item
                                                                )
                                                            }
                                                        >
                                                            {
                                                                item.route
                                                                    .routeCode
                                                            }
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </AutoSizer>
                            </div>
                        </div>
                    </TabPane>
                    <TabPane tab="Sắp chạy" key="2">
                        <div style={{ height: "100%", display: "flex" }}>
                            <div style={{ flex: "1 1 auto" }}>
                                <AutoSizer disableWidth>
                                    {({ height, width }) => (
                                        <div
                                            style={{
                                                height: height,
                                                overflowY: "auto",
                                            }}
                                            className="custom-scroll-bar"
                                        >
                                            {assets.segmentations
                                                .filter((item) =>
                                                    checkPrepareSegmentation(
                                                        item
                                                    )
                                                )
                                                .map((item) => (
                                                    <div className="segmentation-item-wrapper">
                                                        <div className="edit-segmentation-btn">
                                                            <PlusCircleOutlined
                                                                style={{
                                                                    fontSize: 20,
                                                                }}
                                                                onClick={() =>
                                                                    handleEditRoute(
                                                                        item
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                        <div
                                                            className="route-code"
                                                            onClick={() =>
                                                                onSelectSegmentation(
                                                                    item
                                                                )
                                                            }
                                                        >
                                                            {
                                                                item.route
                                                                    .routeCode
                                                            }
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </AutoSizer>
                            </div>
                        </div>
                    </TabPane>
                </Tabs>
            </Col>
            <Modal
                title="Thông tin chi tiết xe"
                visible={descriptionModalVisible}
                onCancel={() => setDescriptionModalVisible(false)}
                footer={false}
                width={1000}
                style={{ top: 20 }}
            >
                <div style={{ minHeight: 500 }}>
                    <CarBoxInfo
                        carInfo={activeInfoWindow}
                        units={assets.userUnits}
                    />
                </div>
            </Modal>
            <Modal
                title="Lộ trình"
                visible={routeModalVisible}
                onCancel={() => setRouteModalVisible(false)}
                style={{ top: 20 }}
                footer={false}
                width={"50vw"}
            >
                <RouteInfoTable
                    segmentation={selectedSegmentation}
                    drivers={assets.drivers}
                    atmTechnicans={assets.atmTechnicans}
                    treasurers={assets.treasurers}
                    transactionPoints={assets.transactionPoints}
                    wayPoints={wayPoints}
                    autoTurnBack={routeAutoTurnBack}
                    setVisible={setRouteModalVisible}
                    reloadSegmentation={reloadSegmentation}
                />
            </Modal>
            <CustomSkeleton loading={loading} />
        </Row>
    );
};

export default Home;
