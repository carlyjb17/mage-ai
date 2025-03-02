import { useCallback, useMemo } from 'react';
import Ansi from 'ansi-to-react';

import BlockType, { StatusTypeEnum } from '@interfaces/BlockType';
import Circle from '@oracle/elements/Circle';
import DataTable from '@components/DataTable';
import FlexContainer from '@oracle/components/FlexContainer';
import KernelOutputType, {
  DataTypeEnum,
  DATA_TYPE_TEXTLIKE,
} from '@interfaces/KernelOutputType';
import Spacing from '@oracle/elements/Spacing';
import Text from '@oracle/elements/Text';
import Tooltip from '@oracle/components/Tooltip';
import { BorderColorShareProps } from '../index.style';
import { Check } from '@oracle/icons';
import {
  ContainerStyle,
  ExtraInfoBorderStyle,
  ExtraInfoContentStyle,
  ExtraInfoStyle,
  OutputRowStyle,
} from './index.style';
import { SCROLLBAR_WIDTH } from '@oracle/styles/scrollbars';
import { PADDING_UNITS, UNIT } from '@oracle/styles/units/spacing';
import { isJsonString } from '@utils/string';

type CodeOutputProps = {
  block: BlockType;
  isInProgress: boolean;
  mainContainerWidth: number;
  messages: KernelOutputType[];
  runCount: number;
  runEndTime: number;
  runStartTime: number;
} & BorderColorShareProps;

function CodeOutput({
  block,
  hasError,
  isInProgress,
  mainContainerWidth,
  messages,
  runCount,
  runEndTime,
  runStartTime,
  selected,
}: CodeOutputProps) {
  const {
    status,
    type: blockType,
  } = block;
  const numberOfMessages = useMemo(() => messages?.length || 0, [messages]);
  const primaryDataType = messages[0].type;
  const executedAndIdle = StatusTypeEnum.EXECUTED === status
    || (!isInProgress && runCount === 0 && numberOfMessages >= 1)
    || (!isInProgress && runCount >= 1 && runEndTime >= runStartTime);

  const createDataTableElement = useCallback(({
    columns,
    index,
    rows,
  }) => rows.length >= 1 && (
    <DataTable
      columns={columns}
      disableScrolling={!selected}
      maxHeight={UNIT * 49.5}
      index={index}
      noBorderBottom
      noBorderLeft
      noBorderRight
      noBorderTop
      rows={rows}
      // Remove border 2px and padding from each side
      width={mainContainerWidth - (2 + (PADDING_UNITS * UNIT * 2) + 2 + SCROLLBAR_WIDTH)}
    />
  ), [
    selected,
    mainContainerWidth,
  ]);

  const internalOutputRegex = /\[__internal_output__\]/;
  const combineTextData = (data) => (Array.isArray(data) ? data.join('\n') : data);

  const combinedMessages = useMemo(() => messages.reduce((arr, curr) => {
    const last = arr.at(-1);
    
    if (DATA_TYPE_TEXTLIKE.includes(last?.type)
      && last?.type === curr.type
      && !combineTextData(curr?.data).match(internalOutputRegex)) {
      last.data += combineTextData(curr.data);
    } else if (DATA_TYPE_TEXTLIKE.includes(curr?.type)
      && !combineTextData(curr?.data).match(internalOutputRegex)) {
      arr.push({
        ...curr,
        data: combineTextData(curr.data),
      });
    } else {
      arr.push({ ...curr });
    }

    return arr;
  }, []), [
    messages,
  ]);

  return (
    <>
      <ContainerStyle
        blockType={blockType}
        executedAndIdle={executedAndIdle}
        hasError={hasError}
        selected={selected}
      >
        {combinedMessages?.map(({
          data: dataInit,
          type: dataType,
        }: KernelOutputType, idx: number) => {
          if (!dataInit || dataInit?.length === 0) {
            return;
          }

          let dataArray: string[] = [];
          if (Array.isArray(dataInit)) {
            dataArray = dataInit;
          } else {
            dataArray = [dataInit];
          }
          dataArray = dataArray.filter(d => d);
          const dataArrayLength = dataArray.length;

          return dataArray.map((data: string, idxInner: number) => {
            let displayElement;
            const outputRowSharedProps = {
              first: idx === 0 && idxInner === 0,
              last: idx === numberOfMessages - 1 && idxInner === dataArrayLength - 1,
            };

            if (typeof data === 'string' && data.match(internalOutputRegex)) {
              const rawString = data.replace(internalOutputRegex, '');
              if (isJsonString(rawString)) {
                const {
                  data: dataDisplay,
                  type: typeDisplay,
                } = JSON.parse(rawString);

                if (DataTypeEnum.TABLE === typeDisplay) {
                  displayElement = createDataTableElement(dataDisplay);
                }
              }
            } else if (dataType === DataTypeEnum.TABLE) {
              displayElement = createDataTableElement(isJsonString(data) ? JSON.parse(data) : data);
            } else if (DATA_TYPE_TEXTLIKE.includes(dataType)) {
              displayElement = (
                <OutputRowStyle {...outputRowSharedProps}>
                  <Text monospace preWrap>
                    <Ansi>
                      {data}
                    </Ansi>
                  </Text>
                </OutputRowStyle>
              );
            } else if (dataType === DataTypeEnum.IMAGE_PNG) {
              displayElement = (
                <div style={{ backgroundColor: 'white' }}>
                  <img
                    alt={`Image ${idx} from code output`}
                    src={`data:image/png;base64, ${data}`}
                  />
                </div>
              );
            }

            return (
              <div key={`code-output-${idx}-${idxInner}`}>
                {displayElement}
              </div>
            );
          });
        })}
      </ContainerStyle>

      {executedAndIdle && (
        <ExtraInfoStyle
          blockType={blockType}
          hasError={hasError}
          selected={selected}
        >
          <ExtraInfoBorderStyle />

          <ExtraInfoContentStyle>
            <FlexContainer
              alignItems="center"
              fullWidth
              justifyContent="flex-end"
            >
              <Tooltip
                appearAbove
                appearBefore
                block
                label={runCount >= 1 && runStartTime
                  ? `Last run at ${new Date(runStartTime.valueOf()).toLocaleString()}`
                  : (
                    hasError
                      ? 'Block executed with errors'
                      : 'Block executed successfully'
                  )
                }
                size={null}
                widthFitContent
              >
                <FlexContainer alignItems="center">
                  {runCount >= 1 && (
                    <>
                      <Text small>
                        {(Number(runEndTime) - Number(runStartTime)) / 1000}s
                      </Text>

                      <Spacing mr={1} />
                    </>
                  )}

                  {!hasError && <Check size={UNIT * 2} success />}
                  {hasError && (
                    <Circle
                      danger
                      size={UNIT * 2}
                    >
                      <Text bold monospace small>
                        !
                      </Text>
                    </Circle>
                  )}
                </FlexContainer>
              </Tooltip>
            </FlexContainer>
          </ExtraInfoContentStyle>
        </ExtraInfoStyle>
      )}
    </>
  );
}

export default CodeOutput;
