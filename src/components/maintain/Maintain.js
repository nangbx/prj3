import { useState, useEffect } from "react";
import FormInsurance from "./FormInsurance";
import FormMainTain from "./FormMaintain";
import CustomSkeleton from "../skeleton/CustomSkeleton";
import FormRegistry from "./FormRegistry";
import FormReplaceOil from "./FormReplaceOil";
import FormRepair from "./FormRepair";
import { Card, Input, Select, Space, Option } from "antd";
import { useParams } from "react-router-dom";
import makeRequest from "../../utils/makeRequest";
import { requestUrl } from "../../resource/requestUrl";
import { addListKey } from "../../utils/addListKey";
import SearchSelect from "../seachItem/SearchSelect";

const Maintain = (props) => {
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState();
    const { id } = useParams();
    useEffect(() => {
        const getData = async () => {
            let [carRs] = await Promise.all([
                makeRequest({
                    method: "GET",
                    url: requestUrl.car.readUrl(),
                    params: {
                        paging: false,
                    },
                }),
            ]);
            setCars(addListKey(carRs.data));
            if (id) {
                setSearch(id);
            }
            setLoading(false);
        };
        getData();
    }, []);
    const onChange = (value) => {
        setSearch(value);
    };
    const handleGetLicensePlate = (id) => {
        const car = cars.find((item) => {
            return item.id === parseInt(id);
        });
        return car?.licensePlate;
    };
    return (
        <>
            <Card>
                <Space>
                    <Select
                        showSearch
                        style={{ width: 200 }}
                        placeholder="Tìm xe"
                        onChange={onChange}
                        allowClear
                        filterOption={(input, option) => {
                            return (option?.label ?? "")
                                .toLowerCase()
                                .includes(input.toLowerCase());
                        }}
                        options={cars.map((car) => {
                            return {
                                label: car.licensePlate,
                                value: car.id,
                            };
                        })}
                        value={handleGetLicensePlate(search)}
                    />
                </Space>
                <>
                    <FormMainTain carId={search} />
                    <FormInsurance carId={search} />
                    <FormRegistry carId={search} />
                    <FormReplaceOil carId={search} />
                    <FormRepair carId={search} />
                </>
            </Card>
            <CustomSkeleton loading={loading} />
        </>
    );
};

export default Maintain;
