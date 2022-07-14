from enum import Enum
from pandas.api.types import infer_dtype
from pandas import DataFrame, Series
from mage_ai.data_cleaner.shared.utils import clean_name
from typing import Callable, Dict, Mapping, Tuple
import numpy as np

"""
Utilities for exporting Python data frames to external databases.
"""


class BadConversionError(Exception):
    """
    Unable to convert Python-based data type to SQL equivalent.
    """

    pass


class PandasTypes(str, Enum):
    """
    Internal datatypes defined by the pandas Public API
    """

    BOOLEAN = 'boolean'
    BYTES = 'bytes'
    CATEGORICAL = 'categorical'
    COMPLEX = 'complex'
    DATE = 'date'
    DATETIME = 'datetime'
    DATETIME64 = 'datetime64'
    DECIMAL = 'decimal'
    INTEGER = 'integer'
    FLOATING = 'floating'
    MIXED = 'mixed'
    MIXED_INTEGER = 'mixed=integer'
    MIXED_INTEGER_FLOAT = 'mixed-integer-float'
    PERIOD = 'period'
    STRING = 'string'
    TIME = 'time'
    TIMEDELTA64 = 'timedelta64'
    TIMEDELTA = 'timedelta'
    UNKNOWN_ARRAY = 'unknown-array'


def infer_dtypes(df: DataFrame) -> Dict[str, str]:
    """
    Fetches the internal pandas datatypes for the columns in the data frame.

    Args:
        df (DataFrame): Data frame to fetch dtypes from.

    Returns:
        Dict[str, str]: Map of column names to inferred dtypes
    """
    return {column: infer_dtype(df[column], skipna=True) for column in df.columns}


def clean_df_for_export(
    df: DataFrame, column_mapper: Callable[[Series, str], str], dtypes: Mapping[str, str]
) -> DataFrame:
    """
    Cleans data frame with the appropriate steps to prepare loading the data frame
    to the target database.

    Args:
        df (DataFrame): Data frame to clean.
        column_mapper (Callable[[Series, str], str]): Function that cleans a column given the
        pandas data type.
        dtypes (Mapping[str, str]): Name of the new table to create

    Returns:
        str: Table creation query for this table.
    """
    copy_df = df.copy()
    for column in df.columns:
        copy_df[column] = column_mapper(copy_df[column], dtypes[column])
    return copy_df


def gen_table_creation_query(
    df: DataFrame,
    dtypes: Mapping[str, str],
    table_name: str,
) -> str:
    """
    Generates a database table creation query from a data frame.

    Args:
        df (DataFrame): Data frame to generate a table creation query for.
        dtypes (Mapping[str, str]): Database relative data types for each column of
        the data frame.
        table_name (str): Name of the new table to create.

    Returns:
        str: Table creation query for this table.
    """
    query = []
    for cname in dtypes:
        query.append(f'{clean_name(cname)} {dtypes[cname]}')
    return f'CREATE TABLE {table_name} (' + ','.join(query) + ');'
