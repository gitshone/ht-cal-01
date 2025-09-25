import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto,
} from '../dtos/user.dto';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import {
  PaginationDto,
  ApiResponseDto,
  PaginatedResponseDto,
} from '../../../shared/dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Email or handle already exists' })
  async create(
    @Body() createUserDto: CreateUserDto
  ): Promise<ApiResponseDto<UserResponseDto>> {
    const user = await this.usersService.create(createUserDto);
    return ApiResponseDto.success('User created successfully', user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    type: PaginatedResponseDto,
  })
  async findAll(
    @Query() paginationDto: PaginationDto
  ): Promise<ApiResponseDto<PaginatedResponseDto<UserResponseDto>>> {
    const result = await this.usersService.findAll(
      paginationDto.skip,
      paginationDto.take
    );
    return ApiResponseDto.success('Users retrieved successfully', result);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserResponseDto,
  })
  async getProfile(@Req() req: any): Promise<ApiResponseDto<UserResponseDto>> {
    const user = await this.usersService.findOne(req.user.userId);
    return ApiResponseDto.success('Profile retrieved successfully', user);
  }

  @Get('handle/:handle')
  @ApiOperation({ summary: 'Get user by handle' })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findByHandle(
    @Param('handle') handle: string
  ): Promise<ApiResponseDto<UserResponseDto>> {
    const user = await this.usersService.findByHandle(handle);
    if (!user) {
      return ApiResponseDto.error('User not found');
    }
    return ApiResponseDto.success('User retrieved successfully', user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(
    @Param('id') id: string
  ): Promise<ApiResponseDto<UserResponseDto>> {
    const user = await this.usersService.findOne(id);
    return ApiResponseDto.success('User retrieved successfully', user);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Email or handle already exists' })
  async updateProfile(
    @Req() req: any,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<ApiResponseDto<UserResponseDto>> {
    const user = await this.usersService.update(req.user.userId, updateUserDto);
    return ApiResponseDto.success('Profile updated successfully', user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Email or handle already exists' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<ApiResponseDto<UserResponseDto>> {
    const user = await this.usersService.update(id, updateUserDto);
    return ApiResponseDto.success('User updated successfully', user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(
    @Param('id') id: string
  ): Promise<ApiResponseDto<UserResponseDto>> {
    const user = await this.usersService.remove(id);
    return ApiResponseDto.success('User deleted successfully', user);
  }
}
