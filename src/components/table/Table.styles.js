import styled from 'styled-components';
import { Table as AntdTable } from 'antd';

export const Table = styled(AntdTable)`
  & thead .ant-table-cell {
    color: #01509A;
    font-size: 0.875rem;
    line-height: 1.25rem;

    & .anticon {
      color: #01509A;
    }
  }

  & tbody .ant-table-cell {
    color: #404040;
    font-size:0.875rem;
    line-height: 1.25rem;
  }

  & tbody .ant-table-row-expand-icon {
    min-height: 1.25rem;
    min-width: 1.25rem;
    border-radius: 0.1875rem;
    margin-top: 0;
  }

  // Override default antd selector
  &
  .ant-table-thead
  > tr
  > th:not(:last-child):not(.ant-table-selection-column):not(.ant-table-row-expand-icon-cell):not([colspan])::before {
    background-color: #01509A;
  }

  & .ant-pagination-prev,
  .ant-pagination-next,
  .ant-pagination-jump-prev,
  .ant-pagination-jump-next,
  .ant-pagination-item {
    min-width: 2.0625rem;
    height: 2.0625rem;
    line-height: 2.0625rem;
    border-radius: 0;
    font-size: 0.875rem;
  }

  & .ant-pagination-prev .ant-pagination-item-link,
  .ant-pagination-next .ant-pagination-item-link {
    border-radius: 0;
  }

  & .ant-checkbox-inner {
    border-radius: 0.1875rem;
    height: 1.25rem;
    width: 1.25rem;
    border: 1px solid #01509A;
  }

  & .editable-row .ant-form-item-explain {
    position: absolute;
    top: 100%;
    font-size: 0.75rem;
  }

  .ant-table-column-sort {
    background-color: transparent;
  }

  .ant-pagination-item-container .ant-pagination-item-ellipsis {
    color: rgba(0, 0, 0, 0.25);
  }

  .ant-pagination-disabled {
    .ant-pagination-item-link,
    .ant-pagination-item a {
      color: rgba(0, 0, 0, 0.25);
    }
  }

  .ant-pagination.ant-pagination-disabled {
    .ant-pagination-item-link,
    .ant-pagination-item a {
      color: rgba(0, 0, 0, 0.25);
    }
  }
`;
