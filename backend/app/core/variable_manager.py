import json
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from jinja2 import Template, Environment, select_autoescape
from app.models.variable import Variable, VariableType
from app.models.execution import Execution

class VariableManager:
    def __init__(self, db: Session):
        self.db = db
        self.jinja_env = Environment(
            autoescape=select_autoescape(['html', 'xml'])
        )
    
    async def set_variable(self, execution_id: int, name: str, value: Any, var_type: VariableType, created_by_node: str):
        """设置单个变量"""
        # 检查变量是否已存在
        existing_var = self.db.query(Variable).filter(
            Variable.execution_id == execution_id,
            Variable.name == name
        ).first()
        
        if existing_var:
            # 更新现有变量
            existing_var.value = self._serialize_value(value, var_type)
            existing_var.type = var_type
            existing_var.created_by_node = created_by_node
        else:
            # 创建新变量
            variable = Variable(
                execution_id=execution_id,
                name=name,
                value=self._serialize_value(value, var_type),
                type=var_type,
                created_by_node=created_by_node
            )
            self.db.add(variable)
        
        self.db.commit()
    
    async def set_variables(self, execution_id: int, variables: Dict[str, Any], created_by_node: str):
        """批量设置变量"""
        for name, value in variables.items():
            var_type = self._infer_type(value)
            await self.set_variable(execution_id, name, value, var_type, created_by_node)
    
    async def get_variable(self, execution_id: int, name: str) -> Optional[Any]:
        """获取单个变量"""
        variable = self.db.query(Variable).filter(
            Variable.execution_id == execution_id,
            Variable.name == name
        ).first()
        
        if variable:
            return self._deserialize_value(variable.value, variable.type)
        return None
    
    async def get_all_variables(self, execution_id: int) -> Dict[str, Any]:
        """获取所有变量"""
        variables = self.db.query(Variable).filter(
            Variable.execution_id == execution_id
        ).all()
        
        result = {}
        for var in variables:
            result[var.name] = self._deserialize_value(var.value, var.type)
        
        return result
    
    async def render_template(self, execution_id: int, template_str: str) -> str:
        """使用Jinja2渲染模板"""
        try:
            # 获取所有变量作为模板上下文
            variables = await self.get_all_variables(execution_id)
            
            # 创建Jinja2模板
            template = self.jinja_env.from_string(template_str)
            
            # 渲染模板
            return template.render(**variables)
        except Exception as e:
            raise Exception(f"Template rendering error: {str(e)}")
    
    def _serialize_value(self, value: Any, var_type: VariableType) -> str:
        """序列化变量值"""
        if var_type == VariableType.JSON:
            return json.dumps(value)
        elif var_type == VariableType.BOOLEAN:
            return str(bool(value)).lower()
        else:
            return str(value)
    
    def _deserialize_value(self, value: str, var_type: VariableType) -> Any:
        """反序列化变量值"""
        try:
            if var_type == VariableType.JSON:
                return json.loads(value)
            elif var_type == VariableType.NUMBER:
                # 尝试转换为整数，如果失败则转换为浮点数
                try:
                    return int(value)
                except ValueError:
                    return float(value)
            elif var_type == VariableType.BOOLEAN:
                return value.lower() in ('true', '1', 'yes', 'on')
            else:
                return value
        except Exception:
            # 如果反序列化失败，返回原始字符串
            return value
    
    def _infer_type(self, value: Any) -> VariableType:
        """推断变量类型"""
        if isinstance(value, bool):
            return VariableType.BOOLEAN
        elif isinstance(value, (int, float)):
            return VariableType.NUMBER
        elif isinstance(value, str):
            return VariableType.STRING
        else:
            return VariableType.JSON 