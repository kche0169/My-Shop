#!/bin/bash

echo "正在安装测试依赖..."

npm install --save-dev jest@29 supertest@6

echo ""
echo "✅ 测试依赖安装完成!"
echo ""
echo "运行测试命令:"
echo "  npm test           # 运行所有测试 (静默模式)"
echo "  npm test -- --verbose # 显示详细输出"
echo "  npm run test:watch # 监听模式"
