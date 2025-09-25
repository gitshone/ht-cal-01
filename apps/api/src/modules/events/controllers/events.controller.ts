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
} from '@nestjs/swagger';
import { EventsService } from '../services/events.service';
import {
  CreateEventDto,
  UpdateEventDto,
  EventResponseDto,
  EventRangeQueryDto,
  GetEventsQueryDto,
} from '../dtos/event.dto';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import {
  PaginationDto,
  ApiResponseDto,
  PaginatedResponseDto,
} from '../../../shared/dto';

@ApiTags('events')
@Controller('events')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({
    status: 201,
    description: 'Event created successfully',
    type: EventResponseDto,
  })
  async create(
    @Req() req: any,
    @Body() createEventDto: CreateEventDto
  ): Promise<ApiResponseDto<EventResponseDto>> {
    const event = await this.eventsService.create(
      req.user.userId,
      createEventDto
    );
    return ApiResponseDto.success('Event created successfully', event);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all events for current user with complex query',
  })
  @ApiResponse({
    status: 200,
    description: 'Events retrieved successfully',
    type: [EventResponseDto],
  })
  async findAll(
    @Req() req: any,
    @Query() queryDto: GetEventsQueryDto
  ): Promise<ApiResponseDto<{ events: EventResponseDto[] }>> {
    const events = await this.eventsService.getEvents(
      req.user.userId,
      queryDto.viewType,
      queryDto.startDate,
      queryDto.endDate,
      queryDto.providerFilter,
      queryDto.searchQuery
    );
    return ApiResponseDto.success('Events retrieved successfully', { events });
  }

  @Get('paginated')
  @ApiOperation({ summary: 'Get all events for current user with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Events retrieved successfully',
    type: PaginatedResponseDto,
  })
  async findAllPaginated(
    @Req() req: any,
    @Query() paginationDto: PaginationDto
  ): Promise<ApiResponseDto<PaginatedResponseDto<EventResponseDto>>> {
    const result = await this.eventsService.findAll(
      req.user.userId,
      paginationDto.skip,
      paginationDto.take
    );
    return ApiResponseDto.success('Events retrieved successfully', result);
  }

  @Get('range')
  @ApiOperation({ summary: 'Get events in date range' })
  @ApiResponse({
    status: 200,
    description: 'Events retrieved successfully',
    type: [EventResponseDto],
  })
  async findByDateRange(
    @Req() req: any,
    @Query() rangeQuery: EventRangeQueryDto
  ): Promise<ApiResponseDto<EventResponseDto[]>> {
    const events = await this.eventsService.findByDateRange(
      req.user.userId,
      new Date(rangeQuery.startDate),
      new Date(rangeQuery.endDate)
    );
    return ApiResponseDto.success('Events retrieved successfully', events);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiResponse({
    status: 200,
    description: 'Event retrieved successfully',
    type: EventResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async findOne(
    @Req() req: any,
    @Param('id') id: string
  ): Promise<ApiResponseDto<EventResponseDto>> {
    const event = await this.eventsService.findOne(id, req.user.userId);
    return ApiResponseDto.success('Event retrieved successfully', event);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update event by ID' })
  @ApiResponse({
    status: 200,
    description: 'Event updated successfully',
    type: EventResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto
  ): Promise<ApiResponseDto<EventResponseDto>> {
    const event = await this.eventsService.update(
      id,
      req.user.userId,
      updateEventDto
    );
    return ApiResponseDto.success('Event updated successfully', event);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete event by ID' })
  @ApiResponse({
    status: 200,
    description: 'Event deleted successfully',
    type: EventResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async remove(
    @Req() req: any,
    @Param('id') id: string
  ): Promise<ApiResponseDto<EventResponseDto>> {
    const event = await this.eventsService.remove(id, req.user.userId);
    return ApiResponseDto.success('Event deleted successfully', event);
  }
}
